"""Service discovery and genuine dependency readiness checks."""
import os
import psycopg
from .. import config as cfg
from ..database import connection as db
from . import model_service as ml

def home():
    return {'message': 'AI-Based Security Attack System API is running', 'version': '1.4.0', 'health_endpoint': '/health', 'prediction_endpoint': '/predict', 'history_endpoint': '/history', 'evaluation_endpoint': '/evaluation', 'dataset_start_endpoint': '/dataset-predictions/run', 'dataset_status_endpoint': '/dataset-predictions/status', 'api_documentation': '/docs'}

def health():
    database_connected = False
    try:
        with db.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT 1')
                database_connected = cur.fetchone()[0] == 1
                cur.execute('SELECT id, source FROM prediction_history LIMIT 0')
    except (psycopg.Error, RuntimeError, ValueError, OSError):
        database_connected = False
    return {'status': 'healthy' if database_connected and ml.model is not None else 'degraded', 'model_loaded': ml.model is not None, 'label_mapping_loaded': bool(ml.ID_TO_LABEL), 'database_connected': database_connected, 'missing_artifacts': [str(path.relative_to(cfg.ARTIFACT_ROOT)).replace('\\', '/') for path in (cfg.MODEL_PATH, cfg.MAPPING_PATH, cfg.EVALUATION_REPORT_PATH) if not path.exists()], 'missing_database_settings': [key for key in ('DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD') if not os.getenv(key)], 'expected_features': ml.EXPECTED_FEATURE_COUNT, 'known_classes': len(ml.ID_TO_LABEL), 'class_labels': ml.ID_TO_LABEL, 'api_version': cfg.API_VERSION}
