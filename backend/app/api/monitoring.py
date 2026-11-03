"""Monitoring HTTP routes."""
from fastapi import APIRouter
from ..services import monitoring_service as service

router = APIRouter()
router.add_api_route("/monitoring/status", service.monitoring_status, methods=["GET"])
router.add_api_route("/monitoring/start", service.start_replay, methods=["POST"])
router.add_api_route("/monitoring/stop", service.stop_replay, methods=["POST"])
