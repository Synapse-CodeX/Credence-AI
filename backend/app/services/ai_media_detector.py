import asyncio
import logging

import httpx

from app.config import settings
from app.models.schemas import DeepfakeDetectionResult, ImagePipelineResult, MediaDetectionResult

logger = logging.getLogger(__name__)

SIGHTENGINE_URL = "https://api.sightengine.com/1.0/check.json"


def _score_to_confidence(score: float) -> str:
    if score > 0.85 or score < 0.15:
        return "HIGH"
    if score > 0.65 or score < 0.35:
        return "MEDIUM"
    return "LOW"


def _score_to_verdict(score: float) -> str:
    if score > 0.7:
        return "Likely AI-Generated"
    if score > 0.4:
        return "Possibly AI-Generated"
    return "Likely Real"


async def detect_ai_image(image_url: str) -> MediaDetectionResult:
    """Check a single image URL against SightEngine's genai model."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            SIGHTENGINE_URL,
            params={
                "url": image_url,
                "models": "genai",
                "api_user": settings.sightengine_api_user,
                "api_secret": settings.sightengine_api_secret,
            },
        )
        response.raise_for_status()

    data = response.json()

    if data.get("status") != "success":
        error_msg = data.get("error", {}).get("message", "Unknown SightEngine error")
        raise ValueError(f"SightEngine API error: {error_msg}")

    score = data["type"]["ai_generated"]

    return MediaDetectionResult(
        image_url=image_url,
        ai_generated_score=score,
        verdict=_score_to_verdict(score),
        confidence=_score_to_confidence(score),
    )


async def detect_ai_image_upload(file_bytes: bytes, filename: str) -> MediaDetectionResult:
    """Check an uploaded image file against SightEngine's genai model."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            SIGHTENGINE_URL,
            data={
                "models": "genai",
                "api_user": settings.sightengine_api_user,
                "api_secret": settings.sightengine_api_secret,
            },
            files={'media': (filename, file_bytes)}
        )
        response.raise_for_status()

    data = response.json()

    if data.get("status") != "success":
        error_msg = data.get("error", {}).get("message", "Unknown SightEngine error")
        raise ValueError(f"SightEngine API error: {error_msg}")

    score = data["type"]["ai_generated"]

    return MediaDetectionResult(
        image_url=filename,
        ai_generated_score=score,
        verdict=_score_to_verdict(score),
        confidence=_score_to_confidence(score),
    )


async def detect_ai_images_batch(
    image_urls: list[str],
) -> list[MediaDetectionResult]:
    """Check multiple images concurrently."""
    tasks = [detect_ai_image(url) for url in image_urls]
    results: list[MediaDetectionResult] = []

    for coro in asyncio.as_completed(tasks):
        try:
            result = await coro
            results.append(result)
        except Exception as exc:
            logger.warning("Failed to check image: %s", exc)

    return results


async def detect_deepfake_image_upload(file_bytes: bytes, filename: str) -> DeepfakeDetectionResult:
    """Check an uploaded image file against SightEngine's deepfake model."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            SIGHTENGINE_URL,
            data={
                "models": "deepfake",
                "api_user": settings.sightengine_api_user,
                "api_secret": settings.sightengine_api_secret,
            },
            files={'media': (filename, file_bytes)}
        )
        response.raise_for_status()

    data = response.json()

    if data.get("status") != "success":
        error_msg = data.get("error", {}).get("message", "Unknown SightEngine error")
        raise ValueError(f"SightEngine API error: {error_msg}")

    score = data["type"]["deepfake"]

    def _deepfake_verdict(s: float) -> str:
        if s > 0.7: return "Deepfake Detected"
        if s > 0.4: return "Potential Deepfake"
        return "Likely Real"

    return DeepfakeDetectionResult(
        image_url=filename,
        deepfake_score=score,
        verdict=_deepfake_verdict(score),
        confidence=_score_to_confidence(score),
    )


async def detect_image_pipeline(file_bytes: bytes, filename: str) -> ImagePipelineResult:
    """Sequential pipeline: GenAI -> Deepfake -> Human."""
    # 1. AI Generation Check
    ai_result = await detect_ai_image_upload(file_bytes, filename)
    
    # If AI score is high, return AI detection result
    if ai_result.ai_generated_score > 0.5:
        return ImagePipelineResult(
            image_url=filename,
            ai_result=ai_result,
            final_verdict="AI GENERATED",
            pipeline_stage="genai",
            confidence=ai_result.confidence
        )
    
    # 2. Deepfake Check
    df_result = await detect_deepfake_image_upload(file_bytes, filename)
    
    # If deepfake score is high, return deepfake result
    if df_result.deepfake_score > 0.5:
        return ImagePipelineResult(
            image_url=filename,
            ai_result=ai_result,
            deepfake_result=df_result,
            final_verdict="DEEPFAKE DETECTED",
            pipeline_stage="deepfake",
            confidence=df_result.confidence
        )
    
    # 3. Authentic
    return ImagePipelineResult(
        image_url=filename,
        ai_result=ai_result,
        deepfake_result=df_result,
        final_verdict="AUTHENTIC / REAL",
        pipeline_stage="human",
        confidence="HIGH"
    )
