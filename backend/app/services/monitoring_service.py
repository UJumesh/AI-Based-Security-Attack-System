"""Single-process bounded offline replay with explicit source metadata."""
import logging
import threading
from datetime import datetime, timezone
import pandas as pd
from fastapi import HTTPException
from .. import config as cfg
from ..models.schemas import PredictionRequest, ReplayRequest
from . import model_service as ml
from . import prediction_service as prediction
logger = logging.getLogger(__name__)

replay_lock = threading.Lock()
replay_stop = threading.Event()
replay_thread = None
replay_state = {'status': 'idle', 'processed': 0, 'last_ingestion_at': None, 'error': None}

def replay_worker(config):
    try:
        flows = pd.read_csv(cfg.X_TEST_PATH, nrows=config.limit)
        if list(flows.columns) != ml.FEATURE_NAMES:
            raise ValueError('Replay schema mismatch')
        for values in flows.to_dict(orient='records'):
            if replay_stop.is_set():
                break
            prediction.predict(PredictionRequest(features=values, source='offline_flow'))
            with replay_lock:
                replay_state['processed'] += 1
                replay_state['last_ingestion_at'] = datetime.now(timezone.utc).isoformat()
            if replay_stop.wait(config.interval_seconds):
                break
        with replay_lock:
            replay_state['status'] = 'stopped' if replay_stop.is_set() else 'completed'
    except Exception:
        logger.exception('Offline flow replay failed')
        with replay_lock:
            replay_state.update(status='failed', error='Replay failed. Check database, model and flow compatibility.')

def start_replay(config: ReplayRequest):
    global replay_thread
    ml.require_model()
    if not cfg.X_TEST_PATH.exists():
        raise HTTPException(503, 'Restore X_test.csv to replay real offline flows.')
    with replay_lock:
        if replay_state['status'] == 'running':
            raise HTTPException(409, 'Replay is already running.')
        replay_stop.clear()
        replay_state.update(status='running', processed=0, error=None)
        replay_thread = threading.Thread(target=replay_worker, args=(config,), daemon=True)
        replay_thread.start()
    return monitoring_status()

def stop_replay():
    replay_stop.set()
    return {'message': 'Stop requested; any in-flight prediction may finish.'}

def stop_workers():
    replay_stop.set()
    if replay_thread is not None:
        replay_thread.join(timeout=15)

def monitoring_status():
    with replay_lock:
        state = dict(replay_state)
    return {'mode': 'offline_flow_replay', 'capture_available': False, 'replay_available': cfg.X_TEST_PATH.exists() and ml.model is not None, **state, 'note': 'Replay uses bounded rows from X_test.csv, persists source=offline_flow, and never captures packets. Run one backend worker.'}
