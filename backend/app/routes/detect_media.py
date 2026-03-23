import os
from typing import Annotated

from fastapi import APIRouter, Body, UploadFile, File

from app.models.schemas import (
    BatchMediaDetectionRequest,
    MediaDetectionRequest,
    MediaDetectionResponse,
    MediaDetectionResult,
    ImagePipelineResult,
    VideoDetectionResult,
)
from app.services.ai_media_detector import (
    detect_ai_images_batch,
    detect_ai_image_upload,
    detect_image_pipeline,
)
from app.services.video_service import extract_5_frames

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


@router.post("/extract-frames")
async def extract_frames_endpoint(
    file: UploadFile = File(...),
) -> VideoDetectionResult:
    """Extract 5 frames from a video and process them sequentially through the AI detection pipeline.
    
    Short-circuits if 3 or more frames are flagged as AI or deepfake.
    """
    # 1. Save uploaded video
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    video_path = os.path.join(uploads_dir, file.filename)
    
    with open(video_path, "wb") as f:
        f.write(await file.read())
    
    try:
        # 2. Extract 5 frames
        prefix = os.path.splitext(file.filename)[0]
        frame_paths = extract_5_frames(video_path, prefix)
        
        # 3. Process frames sequentially
        results = []
        flagged_count = 0
        short_circuited = False
        
        for frame_path in frame_paths:
            with open(frame_path, "rb") as f:
                frame_bytes = f.read()
                # Call the pipeline logic directly
                result = await detect_image_pipeline(frame_bytes, os.path.basename(frame_path))
                results.append(result)
                
                # Check if flagged (GenAI or Deepfake)
                if result.pipeline_stage in ["genai", "deepfake"]:
                    flagged_count += 1
                
                # Short-circuit if 3 flagged
                if flagged_count >= 3:
                    short_circuited = True
                    break
        
        # 4. Derive conclusion
        final_conclusion = "Likely AI-Generated / Deepfake Content" if flagged_count >= 3 else "Likely Authentic Content"
        if flagged_count > 0 and flagged_count < 3:
            final_conclusion = "Mixed Results - Potential AI Manipulation Detected"
            
        return VideoDetectionResult(
            filename=file.filename,
            frame_results=results,
            final_conclusion=final_conclusion,
            flagged_count=flagged_count,
            is_short_circuited=short_circuited
        )
    finally:
        # Optional: Cleanup video_path? 
        # For now, we'll keep it as per the existing pattern in extract_frames.py
        pass
