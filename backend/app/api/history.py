"""Validated HTTP query contract for database-wide history retrieval."""
from fastapi import APIRouter, Query
from ..database import history as repository
router = APIRouter()

def get_history(limit: int=Query(20, ge=1, le=100), page: int=Query(1, ge=1, le=1000000), search: str=Query('', max_length=200), status: str=Query('all', pattern='^(all|benign|attack)$'), sort: str=Query('created_at', pattern='^(id|created_at|confidence_percent)$'), direction: str=Query('desc', pattern='^(asc|desc)$')):
    return repository.get_history(limit, page, search, status, sort, direction)

router.add_api_route("/history", get_history, methods=["GET"])
