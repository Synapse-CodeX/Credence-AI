"""POST /api/verify — Start a verification pipeline."""

import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException

from app.models.schemas import VerifyRequest, VerifyResponse, SessionStatus
from app.db.insforge_client import create_session
from app.services.scraper import scrape_url
from app.sockets.events import emit_progress, emit_error

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Verification"])


@router.post("/verify")
async def start_verification(
    body: Annotated[VerifyRequest, Body()],
) -> VerifyResponse:
    """Submit text or a URL for fact-check verification.

    Returns a session_id. Connect to Socket.IO and join the session room
    to receive real-time pipeline progress events.
    """
    if not body.text and not body.url:
        raise HTTPException(
            status_code=422,
            detail="Either 'text' or 'url' must be provided.",
        )

    session_id = str(uuid.uuid4())
    input_text = body.text or ""
    input_url = body.url

    # If URL is provided, scrape it to get text
    if input_url and not input_text:
        try:
            await emit_progress(session_id, "scraping", "started")
            scraped = await scrape_url(input_url)
            input_text = scraped.text
            await emit_progress(
                session_id,
                "scraping",
                "completed",
                {"title": scraped.title, "char_count": len(input_text), "image_count": len(scraped.images)},
            )
        except Exception as exc:
            logger.error("Failed to scrape URL %s: %s", input_url, exc)
            await emit_error(session_id, f"Failed to scrape URL: {exc}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to scrape the provided URL: {exc}",
            )

    if not input_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text content could be extracted.",
        )

    # Persist the session
    await create_session(session_id, input_text, input_url)

    # TODO: Kick off the LangGraph pipeline in the background
    # This will be wired up when agents are built.
    # For now, return the session_id so the frontend can connect.

    return VerifyResponse(
        session_id=session_id,
        status=SessionStatus.PROCESSING,
        message="Verification pipeline started. Connect to Socket.IO for live updates.",
    )
