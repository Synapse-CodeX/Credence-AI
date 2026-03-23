"""Pydantic models for all request/response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Enums ───────────────────────────────────────────────────────────────────

class VerdictEnum(str, Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    PARTIALLY_TRUE = "PARTIALLY_TRUE"
    UNVERIFIABLE = "UNVERIFIABLE"


class ClaimCategory(str, Enum):
    STATISTICAL = "STATISTICAL"
    HISTORICAL = "HISTORICAL"
    SCIENTIFIC = "SCIENTIFIC"
    CURRENT_EVENT = "CURRENT_EVENT"
    QUOTE = "QUOTE"
    OTHER = "OTHER"


class SessionStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── Core domain models ─────────────────────────────────────────────────────

class Claim(BaseModel):
    id: str
    text: str
    category: ClaimCategory
    context: str = ""


class Evidence(BaseModel):
    url: str
    title: str
    snippet: str
    relevance_score: float = Field(ge=0, le=1)
    raw_content: str | None = None


class Verdict(BaseModel):
    claim_id: str
    claim_text: str
    verdict: VerdictEnum
    confidence_score: float = Field(ge=0, le=100)
    reasoning: str
    cited_sources: list[str] = Field(default_factory=list)


class AITextResult(BaseModel):
    ai_probability: float = Field(ge=0, le=1)
    confidence: str
    signals: list[dict[str, str | float]] = Field(default_factory=list)
    verdict: str


class ScrapedContent(BaseModel):
    text: str
    images: list[str] = Field(default_factory=list)
    title: str | None = None


# ─── AI Media Detection (existing) ──────────────────────────────────────────

class MediaDetectionResult(BaseModel):
    image_url: str
    ai_generated_score: float = Field(ge=0, le=1)
    verdict: str
    confidence: str

class DeepfakeDetectionResult(BaseModel):
    image_url: str
    deepfake_score: float = Field(ge=0, le=1)
    verdict: str
    confidence: str

class ImagePipelineResult(BaseModel):
    image_url: str
    ai_result: MediaDetectionResult | None = None
    deepfake_result: DeepfakeDetectionResult | None = None
    final_verdict: str
    pipeline_stage: str  # "genai", "deepfake", or "human"
    confidence: str


class MediaDetectionRequest(BaseModel):
    image_url: str


class MediaDetectionResponse(BaseModel):
    results: list[MediaDetectionResult]


class BatchMediaDetectionRequest(BaseModel):
    image_urls: list[str] = Field(min_length=1, max_length=20)


# ─── Verification Report ────────────────────────────────────────────────────

class Report(BaseModel):
    session_id: str
    input_text: str
    input_url: str | None = None
    claims: list[Claim] = Field(default_factory=list)
    verdicts: list[Verdict] = Field(default_factory=list)
    overall_accuracy: float | None = None
    ai_text_result: AITextResult | None = None
    ai_media_results: list[MediaDetectionResult] = Field(default_factory=list)
    created_at: datetime | None = None


# ─── API request/response models ────────────────────────────────────────────

class VerifyRequest(BaseModel):
    text: str | None = None
    url: str | None = None
    user_id: str | None = None


class VerifyResponse(BaseModel):
    session_id: str
    status: SessionStatus = SessionStatus.PROCESSING
    message: str = "Verification pipeline started"


class ReportResponse(BaseModel):
    session_id: str
    status: SessionStatus
    report: Report | None = None
    error: str | None = None


class HistoryItem(BaseModel):
    session_id: str
    input_text: str
    input_url: str | None = None
    status: str
    overall_accuracy: float | None = None
    claim_count: int = 0
    created_at: datetime | None = None


class HistoryResponse(BaseModel):
    items: list[HistoryItem] = Field(default_factory=list)
    total: int = 0


# ─── Socket.IO event models ─────────────────────────────────────────────────

class PipelineProgress(BaseModel):
    step: str
    status: str  # "started" | "completed" | "error"
    data: dict | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PipelineComplete(BaseModel):
    session_id: str
    report: Report
