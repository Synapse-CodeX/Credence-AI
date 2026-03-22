"""POST /api/verify — Start a verification pipeline."""

import asyncio
import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import VerifyRequest, SessionStatus
from app.db.insforge_client import create_session
from app.agents.graph import run_pipeline_stream
"""POST /api/verify — Start a verification pipeline."""

import asyncio
import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import VerifyRequest, SessionStatus
from app.db.insforge_client import create_session
from app.agents.graph import run_pipeline_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Verification"])


@router.post("/verify")
async def start_verification(
    body: Annotated[VerifyRequest, Body()],
):
    """Submit text or a URL for fact-check verification.

    Returns a Server-Sent Events (SSE) stream yielding real-time progress.
    """
    if not body.text and not body.url:
        raise HTTPException(
            status_code=422,
            detail="Either 'text' or 'url' must be provided.",
        )

    return StreamingResponse(
        run_pipeline_stream(body.text or "", input_url=body.url, user_id=body.user_id),
        media_type="text/event-stream",
    )
