"""System HTTP routes."""
from fastapi import APIRouter
from ..services import system_service as service

router = APIRouter()
router.add_api_route("/", service.home, methods=["GET"])
router.add_api_route("/health", service.health, methods=["GET"])
