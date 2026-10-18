import json
import os
from pathlib import Path
from math import isfinite

import joblib
import pandas as pd
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Project configuration
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "random_forest.pkl"
MAPPING_PATH = PROJECT_ROOT / "ml" / "data" / "processed" / "label_mapping.json"
FEATURE_FILE = (
    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "X_train.csv"
)

app = FastAPI(
    title="AI-Based Security Attack System",
    description=(
        "Machine-learning API for classifying network traffic "
        "and identifying known attack categories."
    ),
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    """Create a PostgreSQL connection using environment variables."""
    required = [
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
    ]
    missing = [key for key in required if not os.getenv(key)]

    if missing:
        raise RuntimeError(
            f"Missing database configuration: {', '.join(missing)}"
        )

    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    )


# Load trained model
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Trained model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# Load label mapping
if not MAPPING_PATH.exists():
    raise FileNotFoundError(f"Label mapping not found: {MAPPING_PATH}")

with MAPPING_PATH.open("r", encoding="utf-8") as file:
    label_mapping = json.load(file)

ID_TO_LABEL = {
    int(class_id): str(label)
    for label, class_id in label_mapping.items()
}

if not ID_TO_LABEL:
    raise RuntimeError("Label mapping is empty.")

model_classes = [int(class_id) for class_id in model.classes_]
unmapped_classes = [
    class_id for class_id in model_classes
    if class_id not in ID_TO_LABEL
]

if unmapped_classes:
    raise RuntimeError(
        f"Model classes missing from label mapping: {unmapped_classes}"
    )

# Get the exact feature names used during training
model_features = getattr(model, "feature_names_in_", None)

if model_features is not None:
    FEATURE_NAMES = list(model_features)
elif FEATURE_FILE.exists():
    FEATURE_NAMES = list(pd.read_csv(FEATURE_FILE, nrows=0).columns)
else:
    raise FileNotFoundError(
        "Feature names unavailable. Check X_train.csv and the model."
    )

EXPECTED_FEATURE_COUNT = int(
    getattr(model, "n_features_in_", len(FEATURE_NAMES))
)

if len(FEATURE_NAMES) != EXPECTED_FEATURE_COUNT:
    raise RuntimeError(
        f"Feature mismatch: names={len(FEATURE_NAMES)}, "
        f"model expects={EXPECTED_FEATURE_COUNT}"
    )


class PredictionRequest(BaseModel):
    features: dict[str, float] = Field(
        ...,
        description=(
            "All expected numeric network traffic features, "
            "using the exact feature names used during training."
        ),
    )


@app.get("/")
def home():
    return {
        "message": "AI-Based Security Attack System API is running",
        "version": "1.2.0",
        "health_endpoint": "/health",
        "prediction_endpoint": "/predict",
        "history_endpoint": "/history",
        "api_documentation": "/docs",
    }


@app.get("/health")
def health():
    database_connected = False

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                database_connected = cur.fetchone()[0] == 1
    except (psycopg.Error, RuntimeError, ValueError):
        database_connected = False

    return {
        "status": "healthy" if database_connected else "degraded",
        "model_loaded": True,
        "label_mapping_loaded": True,
        "database_connected": database_connected,
        "expected_features": EXPECTED_FEATURE_COUNT,
        "known_classes": len(ID_TO_LABEL),
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    supplied = request.features

    missing = [
        name for name in FEATURE_NAMES
        if name not in supplied
    ]
    extra = [
        name for name in supplied
        if name not in FEATURE_NAMES
    ]

    if missing or extra:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Feature names do not match the trained model.",
                "missing_features": missing,
                "extra_features": extra,
                "expected_feature_count": EXPECTED_FEATURE_COUNT,
                "received_feature_count": len(supplied),
            },
        )

    invalid_values = [
        name for name, value in supplied.items()
        if not isfinite(value)
    ]

    if invalid_values:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Feature values must be finite numbers.",
                "invalid_features": invalid_values,
            },
        )

    try:
        row = pd.DataFrame(
            [[supplied[name] for name in FEATURE_NAMES]],
            columns=FEATURE_NAMES,
        )

        predicted_id = int(model.predict(row)[0])
        predicted_label = ID_TO_LABEL.get(predicted_id)

        if predicted_label is None:
            raise RuntimeError(
                f"No label mapping found for class ID {predicted_id}."
            )

        confidence_percent = None

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(row)[0]
            class_ids = [int(class_id) for class_id in model.classes_]
            predicted_index = class_ids.index(predicted_id)
            confidence_percent = round(
                float(probabilities[predicted_index]) * 100, 2
            )

        is_benign = predicted_label.strip().upper() == "BENIGN"

        # Save the prediction in PostgreSQL
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO prediction_history
                            (prediction, prediction_id, is_benign,
                             confidence_percent, features_received)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, created_at
                        """,
                        (
                            predicted_label,
                            predicted_id,
                            is_benign,
                            confidence_percent,
                            len(supplied),
                        ),
                    )
                    saved_row = cur.fetchone()

            history_id = saved_row[0]
            saved_at = saved_row[1].isoformat()

        except (psycopg.Error, RuntimeError, ValueError) as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Prediction was calculated, but saving it to "
                    "the database failed. Check the database connection."
                ),
            ) from exc

        return {
            "prediction": predicted_label,
            "prediction_id": predicted_id,
            "is_benign": is_benign,
            "features_received": len(supplied),
            "confidence_percent": confidence_percent,
            "history_id": history_id,
            "saved_at": saved_at,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {type(exc).__name__}",
        ) from exc


@app.get("/history")
def get_history(limit: int = 20):
    """Return the latest saved predictions."""
    if not 1 <= limit <= 100:
        raise HTTPException(
            status_code=422,
            detail="limit must be between 1 and 100.",
        )

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, prediction, prediction_id, is_benign,
                           confidence_percent, features_received, created_at
                    FROM prediction_history
                    ORDER BY created_at DESC, id DESC
                    LIMIT %s
                    """,
                    (limit,),
                )

                rows = cur.fetchall()

        return {
            "count": len(rows),
            "history": [
                {
                    "id": row[0],
                    "prediction": row[1],
                    "prediction_id": row[2],
                    "is_benign": row[3],
                    "confidence_percent": (
                        float(row[4]) if row[4] is not None else None
                    ),
                    "features_received": row[5],
                    "created_at": row[6].isoformat(),
                }
                for row in rows
            ],
        }

    except (psycopg.Error, RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve prediction history from the database.",
        ) from exc
