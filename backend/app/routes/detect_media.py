from typing import Annotated

from fastapi import APIRouter, Body

from app.models.schemas import (
    BatchMediaDetectionRequest,
    MediaDetectionRequest,
    MediaDetectionResponse,
    MediaDetectionResult,
)
from app.services.ai_media_detector import detect_ai_image, detect_ai_images_batch

router = APIRouter(prefix="/api/detect-media", tags=["AI Media Detection"])


@router.post("/image")
async def check_single_image(
    body: Annotated[MediaDetectionRequest, Body()],
) -> MediaDetectionResult:
    """Check if a single image is AI-generated using SightEngine."""
    return await detect_ai_image(body.image_url)


@router.post("/images")
async def check_multiple_images(
    body: Annotated[BatchMediaDetectionRequest, Body()],
) -> MediaDetectionResponse:
    """Check multiple images for AI generation. Max 20 images per request."""
    results = await detect_ai_images_batch(body.image_urls)
    return MediaDetectionResponse(results=results)
