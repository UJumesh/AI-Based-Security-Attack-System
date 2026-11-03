"""Feature validation, actual inference and durable history orchestration."""
import logging
from math import isfinite
import pandas as pd
import psycopg
from fastapi import HTTPException
from ..models.schemas import PredictionRequest
from ..database import history
from . import model_service as ml

logger = logging.getLogger(__name__)


def predict(request: PredictionRequest):
    ml.require_model()
    supplied = request.features
    missing = [name for name in ml.FEATURE_NAMES if name not in supplied]
    extra = [name for name in supplied if name not in ml.FEATURE_NAMES]
    if missing or extra:
        raise HTTPException(422, {
            "message": "Feature names do not match the trained model.",
            "missing_features": missing, "extra_features": extra,
            "expected_feature_count": ml.EXPECTED_FEATURE_COUNT,
            "received_feature_count": len(supplied),
        })
    if any(not isfinite(value) for value in supplied.values()):
        raise HTTPException(422, "Feature values must be finite numbers.")
    try:
        row = pd.DataFrame([[supplied[name] for name in ml.FEATURE_NAMES]], columns=ml.FEATURE_NAMES)
        predicted_id = int(ml.model.predict(row)[0])
        label = ml.ID_TO_LABEL[predicted_id]
        confidence = None
        if hasattr(ml.model, "predict_proba"):
            probabilities = ml.model.predict_proba(row)[0]
            class_ids = [int(value) for value in ml.model.classes_]
            confidence = round(float(probabilities[class_ids.index(predicted_id)]) * 100, 2)
        is_benign = label.strip().upper() == "BENIGN"
        try:
            saved = history.save_prediction(label, predicted_id, is_benign, confidence, len(supplied), request.source)
        except (psycopg.Error, RuntimeError, ValueError, OSError) as exc:
            logger.warning("Prediction persistence failed (%s)", type(exc).__name__)
            raise HTTPException(503, "Prediction succeeded, but saving history failed.") from exc
        return {"prediction": label, "prediction_id": predicted_id, "is_benign": is_benign,
                "features_received": len(supplied), "confidence_percent": confidence,
                "history_id": saved[0], "source": request.source, "saved_at": saved[1].isoformat()}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(500, "Prediction failed. Consult server logs.") from exc
