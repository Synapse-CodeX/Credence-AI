"""GET /api/history — Past verification reports."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.db.insforge_client import get_history
from app.models.schemas import HistoryResponse

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/history")
async def list_history(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> HistoryResponse:
    """List past verification sessions with pagination."""
    items, total = await get_history(limit=limit, offset=offset)
    return HistoryResponse(items=items, total=total)
