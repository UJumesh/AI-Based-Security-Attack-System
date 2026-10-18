import json

import os

import threading

import uuid

from collections import Counter

from pathlib import Path

from math import isfinite

import joblib

import numpy as np

import pandas as pd

import psycopg

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, BackgroundTasks

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from sklearn.metrics import classification_report, confusion_matrix

# ============================================================

# CONFIGURATION

# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    raw_env = env_path.read_text(encoding="utf-8-sig")
    if raw_env.startswith("\ufeff"):
        env_path.write_text(raw_env.lstrip("\ufeff"), encoding="utf-8")

load_dotenv(env_path, override=True)

MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "random_forest.pkl"

MAPPING_PATH = (

    PROJECT_ROOT / "ml" / "data" / "processed" / "label_mapping.json"

)

FEATURE_FILE = (

    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "X_train.csv"

)

X_TEST_PATH = (

    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "X_test.csv"

)

Y_TEST_PATH = (

    PROJECT_ROOT / "ml" / "data" / "processed" / "split" / "y_test.csv"

)

EVALUATION_REPORT_PATH = (

    PROJECT_ROOT / "ml" / "data" / "processed" / "evaluation_report.json"

)

BATCH_SIZE = 20000

app = FastAPI(

    title="AI-Based Security Attack System",

    description=(

        "Machine-learning API for network traffic classification, "

        "CIC-IDS2017 batch predictions and attack-category analysis."

    ),

    version="1.4.0",

)

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

# ============================================================

# DATABASE

# ============================================================

def get_db_connection():

    required = [
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
    ]

    missing = [key for key in required if not os.getenv(key)]

    if missing:
        raise RuntimeError(f"Missing database configuration: {', '.join(missing)}")

    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    )

# MODEL AND LABEL MAPPING

# ============================================================


def ensure_prediction_history_table():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS prediction_history (
                        id SERIAL PRIMARY KEY,
                        prediction TEXT NOT NULL,
                        prediction_id INTEGER NOT NULL,
                        is_benign BOOLEAN NOT NULL,
                        confidence_percent DOUBLE PRECISION,
                        features_received INTEGER NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                conn.commit()
    except (psycopg.Error, RuntimeError, ValueError, OSError):
        return False
    return True


@app.on_event("startup")
def startup_event():
    ensure_prediction_history_table()

if not MODEL_PATH.exists():

    raise FileNotFoundError(f"Trained model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

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

unmapped = [class_id for class_id in model_classes

            if class_id not in ID_TO_LABEL]

if unmapped:

    raise RuntimeError(f"Missing label mapping for IDs: {unmapped}")

model_features = getattr(model, "feature_names_in_", None)

if model_features is not None:

    FEATURE_NAMES = list(model_features)

elif FEATURE_FILE.exists():

    FEATURE_NAMES = list(pd.read_csv(FEATURE_FILE, nrows=0).columns)

else:

    raise FileNotFoundError("Unable to determine model feature names.")

EXPECTED_FEATURE_COUNT = int(

    getattr(model, "n_features_in_", len(FEATURE_NAMES))

)

if len(FEATURE_NAMES) != EXPECTED_FEATURE_COUNT:

    raise RuntimeError(

        f"Feature mismatch: {len(FEATURE_NAMES)} names, "

        f"model expects {EXPECTED_FEATURE_COUNT}."

    )

# ============================================================

# REQUEST SCHEMA

# ============================================================

class PredictionRequest(BaseModel):

    features: dict[str, float] = Field(

        ...,

        description="All numeric features required by the trained model.",

    )

# ============================================================

# DATASET JOB STATE

# ============================================================

dataset_lock = threading.Lock()

dataset_job = {

    "job_id": None,

    "status": "idle",

    "progress_percent": 0,

    "processed_records": 0,

    "total_records": None,

    "error": None,

    "result": None,

}

def reset_dataset_job(job_id):

    dataset_job.update({

        "job_id": job_id,

        "status": "queued",

        "progress_percent": 0,

        "processed_records": 0,

        "total_records": None,

        "error": None,

        "result": None,

    })

# ============================================================

# HOME AND HEALTH

# ============================================================

@app.get("/")

def home():

    return {

        "message": "AI-Based Security Attack System API is running",

        "version": "1.4.0",

        "health_endpoint": "/health",

        "prediction_endpoint": "/predict",

        "history_endpoint": "/history",

        "evaluation_endpoint": "/evaluation",

        "dataset_start_endpoint": "/dataset-predictions/run",

        "dataset_status_endpoint": "/dataset-predictions/status",

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

    except (psycopg.Error, RuntimeError, ValueError, OSError):

        database_connected = False

    return {

        "status": "healthy" if database_connected else "degraded",

        "model_loaded": True,

        "label_mapping_loaded": True,

        "database_connected": database_connected,

        "expected_features": EXPECTED_FEATURE_COUNT,

        "known_classes": len(ID_TO_LABEL),

    }

# ============================================================

# SINGLE-FLOW PREDICTION

# ============================================================

@app.post("/predict")

def predict(request: PredictionRequest):

    supplied = request.features

    missing = [name for name in FEATURE_NAMES if name not in supplied]

    extra = [name for name in supplied if name not in FEATURE_NAMES]

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

    if any(not isfinite(value) for value in supplied.values()):

        raise HTTPException(

            status_code=422,

            detail="Feature values must be finite numbers.",

        )

    try:

        row = pd.DataFrame(

            [[supplied[name] for name in FEATURE_NAMES]],

            columns=FEATURE_NAMES,

        )

        predicted_id = int(model.predict(row)[0])

        predicted_label = ID_TO_LABEL[predicted_id]

        confidence = None

        if hasattr(model, "predict_proba"):

            probabilities = model.predict_proba(row)[0]

            class_ids = [int(item) for item in model.classes_]

            confidence = round(

                float(probabilities[class_ids.index(predicted_id)]) * 100,

                2,

            )

        is_benign = predicted_label.strip().upper() == "BENIGN"

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

                            confidence,

                            len(supplied),

                        ),

                    )

                    saved_row = cur.fetchone()

            history_id = saved_row[0]

            saved_at = saved_row[1].isoformat()

        except (psycopg.Error, RuntimeError, ValueError, OSError) as exc:

            raise HTTPException(

                status_code=503,

                detail="Prediction succeeded, but saving history failed.",

            ) from exc

        return {

            "prediction": predicted_label,

            "prediction_id": predicted_id,

            "is_benign": is_benign,

            "features_received": len(supplied),

            "confidence_percent": confidence,

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

# ============================================================

# LIVE / SINGLE-PREDICTION HISTORY

# ============================================================

@app.get("/history")

def get_history(limit: int = 20):

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

    except (psycopg.Error, RuntimeError, ValueError, OSError) as exc:

        raise HTTPException(

            status_code=503,

            detail="Unable to retrieve prediction history.",

        ) from exc

# ============================================================

# SAVED CIC-IDS2017 EVALUATION REPORT

# ============================================================

@app.get("/evaluation")

def get_evaluation():

    if not EVALUATION_REPORT_PATH.exists():

        raise HTTPException(

            status_code=404,

            detail="Run ml/training/validate_model.py first.",

        )

    try:

        with EVALUATION_REPORT_PATH.open("r", encoding="utf-8") as file:

            report = json.load(file)

        required = [

            "test_records",

            "accuracy_percent",

            "macro_f1",

            "class_names",

            "classification_report",

            "confusion_matrix",

        ]

        missing = [field for field in required if field not in report]

        if missing:

            raise HTTPException(

                status_code=500,

                detail={"missing_fields": missing},

            )

        return {

            "source": "CIC-IDS2017",

            "test_records": report["test_records"],

            "correct_predictions": int(report.get("correct_predictions", sum(int(report["confusion_matrix"][i][i]) for i in range(len(report["confusion_matrix"]))))),

            "accuracy_percent": report["accuracy_percent"],

            "macro_f1": report["macro_f1"],

            "class_count": len(report["class_names"]),

            "class_names": report["class_names"],

            "classification_report": report["classification_report"],

            "confusion_matrix": report["confusion_matrix"],

        }

    except HTTPException:

        raise

    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:

        raise HTTPException(

            status_code=500,

            detail="Unable to read the CIC-IDS2017 evaluation report.",

        ) from exc

# ============================================================

# CIC-IDS2017 BATCH PREDICTION WORKER

# ============================================================

def run_dataset_predictions(job_id):

    try:

        dataset_job["status"] = "running"

        if not X_TEST_PATH.exists() or not Y_TEST_PATH.exists():

            raise FileNotFoundError(

                "X_test.csv or y_test.csv was not found in ml/data/processed/split."

            )

        x_rows = sum(

            len(chunk)

            for chunk in pd.read_csv(X_TEST_PATH, chunksize=BATCH_SIZE)

        )

        y_rows = sum(

            len(chunk)

            for chunk in pd.read_csv(Y_TEST_PATH, chunksize=BATCH_SIZE)

        )

        if x_rows != y_rows:

            raise ValueError(

                f"Dataset row mismatch: X_test={x_rows}, y_test={y_rows}."

            )

        if x_rows == 0:

            raise ValueError("The test dataset is empty.")

        dataset_job["total_records"] = x_rows

        actual_ids = []

        predicted_ids = []

        prediction_counts = Counter()

        actual_counts = Counter()

        correct = 0

        processed = 0

        x_reader = pd.read_csv(X_TEST_PATH, chunksize=BATCH_SIZE)

        y_reader = pd.read_csv(Y_TEST_PATH, chunksize=BATCH_SIZE)

        for x_chunk, y_chunk in zip(x_reader, y_reader):

            if list(x_chunk.columns) != FEATURE_NAMES:

                raise ValueError(

                    "X_test.csv feature names/order do not match the trained model."

                )

            if "Label" not in y_chunk.columns:

                raise ValueError("y_test.csv must contain a Label column.")

            x_chunk = x_chunk.replace([np.inf, -np.inf], np.nan)

            if x_chunk.isna().any().any():

                raise ValueError(

                    "X_test.csv contains missing or infinite feature values."

                )

            actual = y_chunk["Label"].astype(int).to_numpy()

            predicted = model.predict(x_chunk)

            predicted = np.asarray(predicted, dtype=int)

            actual_ids.extend(actual.tolist())

            predicted_ids.extend(predicted.tolist())

            correct += int(np.sum(actual == predicted))

            processed += len(x_chunk)

            for value, count in Counter(predicted.tolist()).items():

                prediction_counts[int(value)] += count

            for value, count in Counter(actual.tolist()).items():

                actual_counts[int(value)] += count

            dataset_job["processed_records"] = processed

            dataset_job["progress_percent"] = round(

                processed * 100 / x_rows, 2

            )

        class_ids = sorted(

            set(ID_TO_LABEL.keys())

            | set(actual_counts.keys())

            | set(prediction_counts.keys())

        )

        class_names = [

            ID_TO_LABEL.get(class_id, f"UNKNOWN_{class_id}")

            for class_id in class_ids

        ]

        report = classification_report(

            actual_ids,

            predicted_ids,

            labels=class_ids,

            target_names=class_names,

            output_dict=True,

            zero_division=0,

        )

        matrix = confusion_matrix(

            actual_ids,

            predicted_ids,

            labels=class_ids,

        )

        prediction_breakdown = [

            {

                "class_id": class_id,

                "label": ID_TO_LABEL.get(class_id, f"UNKNOWN_{class_id}"),

                "count": prediction_counts.get(class_id, 0),

                "is_benign": (

                    ID_TO_LABEL.get(class_id, "").strip().upper() == "BENIGN"

                ),

            }

            for class_id in class_ids

        ]

        actual_breakdown = [

            {

                "class_id": class_id,

                "label": ID_TO_LABEL.get(class_id, f"UNKNOWN_{class_id}"),

                "count": actual_counts.get(class_id, 0),

            }

            for class_id in class_ids

        ]

        result = {

            "source": "CIC-IDS2017",

            "job_id": job_id,

            "test_records": processed,

            "correct_predictions": correct,

            "incorrect_predictions": processed - correct,

            "accuracy_percent": round(correct * 100 / processed, 6),

            "class_count": len(class_ids),

            "class_names": class_names,

            "prediction_counts": prediction_breakdown,

            "actual_label_counts": actual_breakdown,

            "classification_report": report,

            "confusion_matrix": matrix.tolist(),

            "note": (

                "Offline test-dataset predictions; these are not live "

                "network traffic detections."

            ),

        }

        dataset_job["result"] = result

        dataset_job["status"] = "completed"

        dataset_job["progress_percent"] = 100

        dataset_job["processed_records"] = processed

    except Exception as exc:

        dataset_job["status"] = "failed"

        dataset_job["error"] = f"{type(exc).__name__}: {exc}"

# ============================================================

# START DATASET PREDICTION JOB

# ============================================================

@app.post("/dataset-predictions/run")

def start_dataset_predictions(background_tasks: BackgroundTasks):

    with dataset_lock:

        if dataset_job["status"] in ("queued", "running"):

            return {

                "message": "A dataset prediction job is already in progress.",

                "job_id": dataset_job["job_id"],

                "status": dataset_job["status"],

            }

        job_id = str(uuid.uuid4())

        reset_dataset_job(job_id)

        background_tasks.add_task(run_dataset_predictions, job_id)

    return {

        "message": "CIC-IDS2017 batch prediction job queued.",

        "job_id": job_id,

        "status": "queued",

        "status_endpoint": "/dataset-predictions/status",

    }

# ============================================================

# DATASET PREDICTION STATUS AND RESULTS

# ============================================================

@app.get("/dataset-predictions/status")

def dataset_predictions_status():

    response = {

        "job_id": dataset_job["job_id"],

        "status": dataset_job["status"],

        "progress_percent": dataset_job["progress_percent"],

        "processed_records": dataset_job["processed_records"],

        "total_records": dataset_job["total_records"],

        "error": dataset_job["error"],

    }

    if dataset_job["status"] == "completed":

        response["result"] = dataset_job["result"]

    return response
