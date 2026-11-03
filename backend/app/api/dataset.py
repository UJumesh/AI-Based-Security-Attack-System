"""Dataset-job HTTP routes, separate from saved prediction history."""
from fastapi import APIRouter
from ..services import dataset_service as service
router = APIRouter()
router.add_api_route("/dataset-predictions/run", service.start_dataset_predictions, methods=["POST"])
router.add_api_route("/dataset-predictions/status", service.dataset_predictions_status, methods=["GET"])
