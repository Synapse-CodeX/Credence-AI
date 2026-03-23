from typing import Annotated

from fastapi import APIRouter, Body, UploadFile, File

from app.models.schemas import (
    BatchMediaDetectionRequest,
    MediaDetectionRequest,
    MediaDetectionResponse,
    MediaDetectionResult,
    ImagePipelineResult,
)
from app.services.ai_media_detector import (
    detect_ai_images_batch,
    detect_ai_image_upload,
    detect_image_pipeline,
)

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


@router.post("/image-upload")
async def check_uploaded_image(
    file: UploadFile = File(...),
) -> MediaDetectionResult:
    """Check a single uploaded image for AI generation."""
    file_bytes = await file.read()
    return await detect_ai_image_upload(file_bytes, file.filename or "uploaded.jpg")


@router.post("/image-pipeline")
async def check_image_pipeline(
    file: UploadFile = File(...),
) -> ImagePipelineResult:
    """Check a single uploaded image using the sequential AI -> Deepfake pipeline."""
    file_bytes = await file.read()
    return await detect_image_pipeline(file_bytes, file.filename or "uploaded.jpg")
