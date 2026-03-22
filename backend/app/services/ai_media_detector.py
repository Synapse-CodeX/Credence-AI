import asyncio
import logging

import httpx

from app.config import settings
from app.models.schemas import MediaDetectionResult

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
