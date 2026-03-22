"""LangGraph pipeline — wraps the existing agent/ modules.

Adds the project-root ``agent/`` directory to ``sys.path`` at import time
so that ``extraction_claim``, ``search_evidence_agent``, etc. can be
imported unchanged.  The public API is ``run_pipeline()``, which:

1. Builds the LangGraph graph from the existing agent nodes.
2. Emits Socket.IO progress events for each step.
3. Translates the agent's output into the backend's Pydantic schemas.
4. Persists the final report to InsForge.
"""

from __future__ import annotations

import asyncio
import uuid
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict, Annotated, Sequence, AsyncGenerator

# ─── Add agent/ directory to the Python path ────────────────────────────────
# Local dev: agent/ is at project-root/agent/ (3 levels up from this file)
# Docker:    agent/ is copied to /agent
_LOCAL_AGENT_DIR = str(Path(__file__).resolve().parents[3] / "agent")
_DOCKER_AGENT_DIR = "/agent"
_AGENT_DIR = _LOCAL_AGENT_DIR if Path(_LOCAL_AGENT_DIR).is_dir() else _DOCKER_AGENT_DIR
if _AGENT_DIR not in sys.path:
    sys.path.insert(0, _AGENT_DIR)

from langgraph.graph import StateGraph, END  # noqa: E402

# Import the existing agent modules (they live in project-root/agent/)
from agent_state import AgentState  # noqa: E402
from extraction_claim import extract_claims  # noqa: E402
from search_evidence_agent import search_evidence  # noqa: E402
from verify_claims_agent import verify_claims  # noqa: E402
from report_gen import generate_report  # noqa: E402

from app.services.scraper import scrape_url

from app.db.insforge_client import update_session_status, create_session  # noqa: E402
from app.models.schemas import (  # noqa: E402
    Claim,
    ClaimCategory,
    Report,
    SessionStatus,
    Verdict,
    VerdictEnum,
    MediaDetectionResult,
)
from app.services.ai_text_detector import detect_ai_text  # noqa: E402
from app.services.ai_media_detector import detect_ai_images_batch  # noqa: E402


logger = logging.getLogger(__name__)

# ─── Verdict / category mapping ─────────────────────────────────────────────

_VERDICT_MAP: dict[str, VerdictEnum] = {
    "true": VerdictEnum.TRUE,
    "false": VerdictEnum.FALSE,
    "partially true": VerdictEnum.PARTIALLY_TRUE,
    "unverifiable": VerdictEnum.UNVERIFIABLE,
}

_CATEGORY_MAP: dict[str, ClaimCategory] = {
    "factual": ClaimCategory.OTHER,
    "numerical": ClaimCategory.STATISTICAL,
    "entity": ClaimCategory.OTHER,
    "temporal": ClaimCategory.HISTORICAL,
}


def _build_graph() -> StateGraph:
    """Build and compile the LangGraph verification graph."""
    builder = StateGraph(AgentState)

    builder.add_node("extract_claims", extract_claims)
    builder.add_node("search_evidence", search_evidence)
    builder.add_node("verify_claims", verify_claims)
    builder.add_node("generate_report", generate_report)

    builder.set_entry_point("extract_claims")
    builder.add_edge("extract_claims", "search_evidence")
    builder.add_edge("search_evidence", "verify_claims")
    builder.add_edge("verify_claims", "generate_report")
    builder.add_edge("generate_report", END)

    return builder.compile()


# Pre-compile the graph once at module level
_compiled_graph = _build_graph()


# ─── Public API ──────────────────────────────────────────────────────────────


async def run_pipeline_stream(
    input_text: str,
    input_url: str | None = None,
    user_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Run the Verification Pipeline and yield Server-Sent Events (SSE).
    """

    def emit(step: str, status: str, data: dict | None = None) -> str:
        """Helper to format SSE strings."""
        payload = {
            "step": step,
            "status": status,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return f"data: {json.dumps(payload)}\n\n"

    session_id: str | None = None

    try:
        scraped_images: list[str] = []

        # If a URL was provided, scrape it to get the text first
        if input_url and not input_text.strip():
            yield emit("scraping", "started", {"message": f"Scraping {input_url}…"})
            try:
                scraped = await scrape_url(input_url)
                input_text = scraped.text
                scraped_images = scraped.images
                yield emit(
                    "scraping",
                    "completed",
                    {"title": scraped.title, "char_count": len(input_text), "image_count": len(scraped_images)},
                )
            except Exception as e:
                yield emit("error", "failed", {"error": f"Failed to scrape URL: {str(e)}"})
                return

        # ─── Initialize session ───────────────────────────────────────────
        session_id = str(uuid.uuid4())
        await create_session(session_id, input_text, input_url, user_id=user_id)

        if not input_text.strip():
            yield emit("error", "failed", {"error": "No text content could be extracted."})
            await update_session_status(session_id, SessionStatus.FAILED)
            return

        yield emit("extracting", "started", {"message": "Extracting claims from text…"})

        initial_state = AgentState(input_text=input_text)
        final_state_dict = dict(initial_state)

        # ── Step 1: Extract + Search + Verify + Report via LangGraph ─────
        # Instead of invoke (which runs everything synchronously and blocks),
        # we use astream to yield updates dynamically as each node completes!
        async for event in _compiled_graph.astream(initial_state):
            for node_name, state_update in event.items():
                if isinstance(state_update, dict):
                    final_state_dict.update(state_update)

                if node_name == "extract_claims":
                    claims = state_update.get("claims", [])
                    yield emit("extracting", "completed", {
                        "claim_count": len(claims),
                        "claims": [c.claim for c in claims],
                    })
                    yield emit("searching", "started", {"message": "Searching for evidence…"})

                elif node_name == "search_evidence":
                    evidence = state_update.get("evidence", {})
                    yield emit("searching", "completed", {
                        "total_sources": sum(len(v) for v in evidence.values()),
                    })
                    yield emit("verifying", "started", {"message": "Verifying claims against evidence…"})

                elif node_name == "verify_claims":
                    verifications = state_update.get("verifications", {})
                    yield emit("verifying", "completed", {
                        "verdict_count": len(verifications),
                    })
                    yield emit("reporting", "started", {"message": "Compiling final report…"})

                elif node_name == "generate_report":
                    yield emit("reporting", "completed", {})

        # ── Step 2: AI text detection ────────────────────────────────────
        ai_text_result = None
        try:
            yield emit("ai_detection", "started", {"message": "Detecting AI-generated text…"})
            ai_text_result = await detect_ai_text(input_text)
            yield emit("ai_detection", "completed", {
                "ai_probability": ai_text_result.ai_probability,
                "verdict": ai_text_result.verdict,
            })
        except Exception as exc:
            logger.warning("AI text detection failed: %s", exc)
            yield emit("ai_detection", "error", {"error": str(exc)})

        # ── Step 3: AI media detection (if images available) ─────────────
        ai_media_results: list[MediaDetectionResult] = []
        images = scraped_images or []
        if images:
            try:
                yield emit("ai_media", "started", {"message": f"Checking {len(images)} images for AI generation…"})
                ai_media_results = await detect_ai_images_batch(images[:10])
                yield emit("ai_media", "completed", {"images_checked": len(ai_media_results)})
            except Exception as exc:
                logger.warning("AI media detection failed: %s", exc)

        # ── Step 4: Assemble structured report ───────────────────────────
        yield emit("reporting", "started", {"message": "Assembling final report…"})

        # Convert agent Claims → backend schema Claims
        agent_claims = final_state_dict.get("claims", [])
        agent_verifications = final_state_dict.get("verifications", {})
        
        claims: list[Claim] = []
        for c in agent_claims:
            claims.append(Claim(
                id=str(c.id),
                text=c.claim,
                category=_CATEGORY_MAP.get(c.type, ClaimCategory.OTHER),
                context="",
            ))

        # Convert agent VerificationResults → backend schema Verdicts
        verdicts: list[Verdict] = []
        for claim_id, v in agent_verifications.items():
            # Find the matching claim text
            claim_text = ""
            for c in agent_claims:
                if c.id == claim_id:
                    claim_text = c.claim
                    break

            verdict_enum = _VERDICT_MAP.get(v.verdict.lower(), VerdictEnum.UNVERIFIABLE)
            verdicts.append(Verdict(
                claim_id=str(claim_id),
                claim_text=claim_text,
                verdict=verdict_enum,
                confidence_score=round(v.confidence * 100, 1),
                reasoning=v.reason,
                cited_sources=v.supporting_sources[:5],
            ))

        # Calculate overall accuracy
        if verdicts:
            true_count = sum(1 for v in verdicts if v.verdict == VerdictEnum.TRUE)
            partial_count = sum(1 for v in verdicts if v.verdict == VerdictEnum.PARTIALLY_TRUE)
            overall_accuracy = round(((true_count + partial_count * 0.5) / len(verdicts)) * 100, 1)
        else:
            overall_accuracy = None

        report = Report(
            session_id=session_id,
            input_text=input_text[:2000],
            input_url=input_url,
            claims=claims,
            verdicts=verdicts,
            overall_accuracy=overall_accuracy,
            ai_text_result=ai_text_result,
            ai_media_results=ai_media_results,
            created_at=datetime.now(timezone.utc),
        )

        # ── Persist to InsForge DB ───────────────────────────────────────
        ai_score = ai_text_result.ai_probability if ai_text_result else None
        await update_session_status(
            session_id, SessionStatus.COMPLETED, report=report, ai_text_score=ai_score,
        )

        # ── Emit completion ──────────────────────────────────────────────
        report_dict = json.loads(report.model_dump_json())
        yield emit("pipeline_complete", "completed", report_dict)
        yield emit("reporting", "completed", {
            "overall_accuracy": overall_accuracy,
            "claim_count": len(claims),
            "verdict_count": len(verdicts),
        })

        logger.info(
            "Pipeline complete for session %s: %.1f%% accuracy, %d claims",
            session_id, overall_accuracy or 0, len(claims),
        )

    except Exception as exc:
        logger.exception("Pipeline failed for session %s", session_id)
        yield emit("error", "failed", {"error": str(exc)})
        if session_id:
            await update_session_status(session_id, SessionStatus.FAILED)
