"""LangGraph pipeline state schema.

This defines the state that flows through the verification pipeline.
Each node reads from and writes to this state.
"""

from __future__ import annotations

from typing import TypedDict

from app.models.schemas import (
    AITextResult,
    Claim,
    Evidence,
    MediaDetectionResult,
    Report,
    Verdict,
)


class VerificationState(TypedDict, total=False):
    """State schema for the LangGraph verification pipeline."""

    # Input
    input_text: str
    input_url: str | None
    session_id: str

    # Scraped content
    scraped_images: list[str]

    # Pipeline outputs
    claims: list[Claim]
    evidences: dict[str, list[Evidence]]  # claim_id → evidence list
    verdicts: list[Verdict]
    report: Report

    # Bonus features
    ai_text_result: AITextResult | None
    ai_media_results: list[MediaDetectionResult]

    # Pipeline control
    errors: list[str]
    current_step: str
