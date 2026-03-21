from pydantic import BaseModel, Field


class MediaDetectionResult(BaseModel):
    image_url: str
    ai_generated_score: float = Field(ge=0, le=1)
    verdict: str
    confidence: str


class MediaDetectionRequest(BaseModel):
    image_url: str


class MediaDetectionResponse(BaseModel):
    results: list[MediaDetectionResult]


class BatchMediaDetectionRequest(BaseModel):
    image_urls: list[str] = Field(min_length=1, max_length=20)
