"""Trusted artifact loading, ordered feature schema and global importance."""
import json
import logging
import joblib
import pandas as pd
from fastapi import HTTPException
from .. import config as cfg
logger = logging.getLogger(__name__)

model = None
ID_TO_LABEL = {}
FEATURE_NAMES = []
EXPECTED_FEATURE_COUNT = 0
artifact_error = None
try:
    if not cfg.MODEL_PATH.exists():
        raise FileNotFoundError(f'Trained model not found: {cfg.MODEL_PATH}')
    model = joblib.load(cfg.MODEL_PATH)
    if not cfg.MAPPING_PATH.exists():
        raise FileNotFoundError(f'Label mapping not found: {cfg.MAPPING_PATH}')
    with cfg.MAPPING_PATH.open('r', encoding='utf-8') as file:
        label_mapping = json.load(file)
    ID_TO_LABEL = {int(class_id): str(label) for label, class_id in label_mapping.items()}
    if len(ID_TO_LABEL) != len(label_mapping):
        raise RuntimeError('Label mapping IDs must be unique.')
    if not ID_TO_LABEL:
        raise RuntimeError('Label mapping is empty.')
    model_classes = [int(class_id) for class_id in model.classes_]
    unmapped = [class_id for class_id in model_classes if class_id not in ID_TO_LABEL]
    if unmapped:
        raise RuntimeError(f'Missing label mapping for IDs: {unmapped}')
    model_features = getattr(model, 'feature_names_in_', None)
    if model_features is not None:
        FEATURE_NAMES = list(model_features)
    elif cfg.FEATURE_FILE.exists():
        FEATURE_NAMES = list(pd.read_csv(cfg.FEATURE_FILE, nrows=0).columns)
    else:
        raise FileNotFoundError('Unable to determine model feature names.')
    EXPECTED_FEATURE_COUNT = int(getattr(model, 'n_features_in_', len(FEATURE_NAMES)))
    if len(FEATURE_NAMES) != EXPECTED_FEATURE_COUNT:
        raise RuntimeError(f'Feature mismatch: {len(FEATURE_NAMES)} names, model expects {EXPECTED_FEATURE_COUNT}.')
except Exception:
    logger.exception('Model artifacts unavailable or incompatible')
    model = None
    ID_TO_LABEL = {}
    FEATURE_NAMES = []
    EXPECTED_FEATURE_COUNT = 0
    artifact_error = 'Restore compatible trusted model, label mapping and feature schema; see setup documentation.'

def require_model():
    if model is None:
        raise HTTPException(503, artifact_error or 'Model unavailable.')

def model_info():
    require_model()
    return {'features': FEATURE_NAMES, 'feature_count': EXPECTED_FEATURE_COUNT, 'classes': ID_TO_LABEL, 'confidence_note': 'Model probability estimates are not guaranteed real-world attack probabilities.'}

def explain():
    require_model()
    values = getattr(model, 'feature_importances_', None)
    if values is None or len(values) != len(FEATURE_NAMES):
        raise HTTPException(503, 'This model does not provide compatible global feature importance.')
    return {'method': 'Random Forest mean decrease in impurity', 'scope': 'global', 'limitation': 'Training impurity importance can favor high-cardinality and correlated features. It is not local attribution or causation.', 'features': sorted([{'feature': n, 'importance': float(v)} for n, v in zip(FEATURE_NAMES, values)], key=lambda r: r['importance'], reverse=True)}
