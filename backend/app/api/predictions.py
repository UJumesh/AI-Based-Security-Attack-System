"""Predictions HTTP routes."""
from fastapi import APIRouter
from ..services import prediction_service as service

router = APIRouter()
router.add_api_route("/predict", service.predict, methods=["POST"])

from ..services import model_service
router.add_api_route("/model-info", model_service.model_info, methods=["GET"])
router.add_api_route("/explain", model_service.explain, methods=["GET"])
