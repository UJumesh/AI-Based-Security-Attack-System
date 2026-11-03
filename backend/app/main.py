"""FastAPI composition root. Run: python -m uvicorn backend.app.main:app."""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import config
from .api import system, predictions, history, evaluation, monitoring, dataset
from .database.connection import ensure_prediction_history_table
from .services.monitoring_service import stop_workers

logger = logging.getLogger(__name__)
app = FastAPI(title="AI-Based Security Attack System", version=config.API_VERSION,
              description="Network-flow classification, saved history and offline evaluation.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["*"],
)
for routes in (system, predictions, history, evaluation, monitoring, dataset):
    app.include_router(routes.router)


@app.on_event("startup")
def startup_event():
    if not ensure_prediction_history_table():
        logger.warning("Prediction history schema initialization unavailable; check database settings and permissions.")


@app.on_event("shutdown")
def shutdown_event():
    stop_workers()
