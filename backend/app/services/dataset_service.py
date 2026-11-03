"""Offline test-set evaluation worker and bounded process-local job state."""
import logging
import threading
import uuid
from collections import Counter
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
from fastapi import BackgroundTasks, HTTPException
from .. import config as cfg
from . import model_service as ml
logger = logging.getLogger(__name__)

dataset_lock = threading.Lock()
dataset_job = {'job_id': None, 'status': 'idle', 'progress_percent': 0, 'processed_records': 0, 'total_records': None, 'error': None, 'result': None}

def reset_dataset_job(job_id):
    dataset_job.update({'job_id': job_id, 'status': 'queued', 'progress_percent': 0, 'processed_records': 0, 'total_records': None, 'error': None, 'result': None})

def run_dataset_predictions(job_id):
    try:
        dataset_job['status'] = 'running'
        if not cfg.X_TEST_PATH.exists() or not cfg.Y_TEST_PATH.exists():
            raise FileNotFoundError('X_test.csv or y_test.csv was not found in ml/data/processed/split.')
        x_rows = sum((len(chunk) for chunk in pd.read_csv(cfg.X_TEST_PATH, chunksize=cfg.BATCH_SIZE)))
        y_rows = sum((len(chunk) for chunk in pd.read_csv(cfg.Y_TEST_PATH, chunksize=cfg.BATCH_SIZE)))
        if x_rows != y_rows:
            raise ValueError(f'Dataset row mismatch: X_test={x_rows}, y_test={y_rows}.')
        if x_rows == 0:
            raise ValueError('The test dataset is empty.')
        if x_rows > 2000000:
            raise ValueError('Offline evaluation exceeds the two million record safety limit')
        dataset_job['total_records'] = x_rows
        actual_ids = []
        predicted_ids = []
        prediction_counts = Counter()
        actual_counts = Counter()
        correct = 0
        processed = 0
        x_reader = pd.read_csv(cfg.X_TEST_PATH, chunksize=cfg.BATCH_SIZE)
        y_reader = pd.read_csv(cfg.Y_TEST_PATH, chunksize=cfg.BATCH_SIZE)
        for x_chunk, y_chunk in zip(x_reader, y_reader):
            if list(x_chunk.columns) != ml.FEATURE_NAMES:
                raise ValueError('X_test.csv feature names/order do not match the trained model.')
            if 'Label' not in y_chunk.columns:
                raise ValueError('y_test.csv must contain a Label column.')
            x_chunk = x_chunk.replace([np.inf, -np.inf], np.nan)
            if x_chunk.isna().any().any():
                raise ValueError('X_test.csv contains missing or infinite feature values.')
            if len(x_chunk) != len(y_chunk):
                raise ValueError('Feature/label chunk sizes differ')
            actual = y_chunk['Label'].astype(int).to_numpy()
            if not set(actual.tolist()).issubset(ml.ID_TO_LABEL):
                raise ValueError('Dataset labels are absent from the model mapping')
            predicted = ml.model.predict(x_chunk)
            predicted = np.asarray(predicted, dtype=int)
            actual_ids.extend(actual.tolist())
            predicted_ids.extend(predicted.tolist())
            correct += int(np.sum(actual == predicted))
            processed += len(x_chunk)
            for value, count in Counter(predicted.tolist()).items():
                prediction_counts[int(value)] += count
            for value, count in Counter(actual.tolist()).items():
                actual_counts[int(value)] += count
            dataset_job['processed_records'] = processed
            dataset_job['progress_percent'] = round(processed * 100 / x_rows, 2)
        class_ids = sorted(set(ml.ID_TO_LABEL.keys()) | set(actual_counts.keys()) | set(prediction_counts.keys()))
        class_names = [ml.ID_TO_LABEL.get(class_id, f'UNKNOWN_{class_id}') for class_id in class_ids]
        report = classification_report(actual_ids, predicted_ids, labels=class_ids, target_names=class_names, output_dict=True, zero_division=0)
        matrix = confusion_matrix(actual_ids, predicted_ids, labels=class_ids)
        prediction_breakdown = [{'class_id': class_id, 'label': ml.ID_TO_LABEL.get(class_id, f'UNKNOWN_{class_id}'), 'count': prediction_counts.get(class_id, 0), 'is_benign': ml.ID_TO_LABEL.get(class_id, '').strip().upper() == 'BENIGN'} for class_id in class_ids]
        actual_breakdown = [{'class_id': class_id, 'label': ml.ID_TO_LABEL.get(class_id, f'UNKNOWN_{class_id}'), 'count': actual_counts.get(class_id, 0)} for class_id in class_ids]
        result = {'source': 'CIC-IDS2017', 'job_id': job_id, 'test_records': processed, 'correct_predictions': correct, 'incorrect_predictions': processed - correct, 'accuracy_percent': round(correct * 100 / processed, 6), 'class_count': len(class_ids), 'class_names': class_names, 'prediction_counts': prediction_breakdown, 'actual_label_counts': actual_breakdown, 'classification_report': report, 'confusion_matrix': matrix.tolist(), 'note': 'Offline test-dataset predictions; these are not live network traffic detections.'}
        dataset_job['result'] = result
        dataset_job['status'] = 'completed'
        dataset_job['progress_percent'] = 100
        dataset_job['processed_records'] = processed
    except Exception as exc:
        dataset_job['status'] = 'failed'
        logger.exception('Offline dataset evaluation failed')
        dataset_job['error'] = 'Offline evaluation failed; inspect server logs and dataset compatibility.'

def start_dataset_predictions(background_tasks: BackgroundTasks):
    ml.require_model()
    if not cfg.X_TEST_PATH.exists() or not cfg.Y_TEST_PATH.exists():
        raise HTTPException(503, 'Restore X_test.csv and y_test.csv to run offline evaluation.')
    with dataset_lock:
        if dataset_job['status'] in ('queued', 'running'):
            return {'message': 'A dataset prediction job is already in progress.', 'job_id': dataset_job['job_id'], 'status': dataset_job['status']}
        job_id = str(uuid.uuid4())
        reset_dataset_job(job_id)
        background_tasks.add_task(run_dataset_predictions, job_id)
    return {'message': 'CIC-IDS2017 batch prediction job queued.', 'job_id': job_id, 'status': 'queued', 'status_endpoint': '/dataset-predictions/status'}

def dataset_predictions_status():
    response = {'job_id': dataset_job['job_id'], 'status': dataset_job['status'], 'progress_percent': dataset_job['progress_percent'], 'processed_records': dataset_job['processed_records'], 'total_records': dataset_job['total_records'], 'error': dataset_job['error']}
    if dataset_job['status'] == 'completed':
        response['result'] = dataset_job['result']
    return response
