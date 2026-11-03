"""Evaluation HTTP routes."""
from fastapi import APIRouter
from ..services import evaluation_service as service

router = APIRouter()
router.add_api_route("/evaluation", service.get_evaluation, methods=["GET"])
router.add_api_route("/dataset-summary", service.dataset_summary, methods=["GET"])
