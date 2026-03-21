from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

# -----------------------------
# PYDANTIC STATE
# -----------------------------
class Claim(BaseModel):
    id: int = Field(..., description="Unique identifier like 1,2,3")
    claim: str = Field(..., description="Atomic factual claim")
    type: Literal["factual", "numerical", "entity", "temporal"]
    confidence: float = Field(..., ge=0.0, le=1.0)

    normalized_claim: Optional[str] = Field(
        default=None,
        description="Cleaned/normalized version for search"
    )

class ClaimExtractionOutput(BaseModel):
   claims: List[Claim] = Field(default_factory=list, description="List of extracted claims with details")
# -----------------------------
# EVIDENCE SOURCE
# -----------------------------
class EvidenceSource(BaseModel):
    title: str = Field(..., description="Title of the evidence source")
    content: str = Field(..., description="Relevant content from the source that supports the claim")
    url: str = Field(description="URL of the evidence source")
    score: Optional[float] = Field(default=None, description="Relevance score of the evidence source")
    query_used: Optional[str] = Field(default=None, description="The search query used to find the evidence source")
    credibility: Optional[float] = Field(
        default=None,
        description="Estimated credibility (0-1)"
    )

# -----------------------------
# VERIFICATION RESULT
# -----------------------------
class VerificationResult(BaseModel):
    verdict: Literal["True", "False", "Partially True", "Unverifiable"] = Field(..., description="The verification verdict for the claim")
    confidence: float = Field(..., description="Confidence in the verification result (0.0 to 1.0)")
    reason: str = Field(..., description="Reason for the verification result")
    supporting_sources: List[str] = Field(default_factory=list, description="List of URLs for supporting evidence sources")
    conflicting_sources: List[str] = Field(
        default_factory=list,
        description="Sources that contradict the claim"
    )
    uncertainty_reason: Optional[str] = Field(
        default=None,
        description="Why confidence is low or uncertain"
    )
    

# -----------------------------
# MAIN AGENT STATE
# -----------------------------
class AgentState(BaseModel):
    input_text: str = Field(..., description="The original input text containing claims to be verified")
    claims: List[Claim] = Field(default_factory=list,description="List of claims extracted from the input text")
    evidence: Dict[int, List[EvidenceSource]] = Field(default_factory=dict, description="Mapping of claim text to list of evidence sources")
    verifications: Dict[int, VerificationResult] = Field(default_factory=dict, description="Mapping of claim text to verification results")
    final_report: str = Field(default="", description="The final report summarizing all claims and their verification results")
