"""GET /api/report/{session_id} — Fetch a completed verification report."""

import json
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path

from app.db.insforge_client import get_session
from app.models.schemas import Report, ReportResponse, SessionStatus

router = APIRouter(prefix="/api", tags=["Reports"])


@router.get("/report/{session_id}")
async def get_report(
    session_id: Annotated[str, Path(description="The verification session ID")],
) -> ReportResponse:
    """Fetch the verification report for a given session."""
    session = await get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    status = SessionStatus(session.get("status", "processing"))
    report_data = session.get("report")

    report = None
    if report_data and isinstance(report_data, dict):
        report = Report(**report_data)

    error = None
    if status == SessionStatus.FAILED:
        error = "Verification pipeline failed. Please try again."

    return ReportResponse(
        session_id=session_id,
        status=status,
        report=report,
        error=error,
    )
