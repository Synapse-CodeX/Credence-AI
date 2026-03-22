"""POST /api/detect-text — Standalone AI text detection."""

from typing import Annotated

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel

from app.models.schemas import AITextResult
from app.services.ai_text_detector import detect_ai_text

router = APIRouter(prefix="/api", tags=["AI Text Detection"])


class AITextDetectionRequest(BaseModel):
    text: str


@router.post("/detect-text")
async def check_ai_text(
    body: Annotated[AITextDetectionRequest, Body()],
) -> AITextResult:
    """Analyze text for AI-generation probability."""
    if not body.text.strip():
        raise HTTPException(status_code=422, detail="Text must not be empty.")

    return await detect_ai_text(body.text)
