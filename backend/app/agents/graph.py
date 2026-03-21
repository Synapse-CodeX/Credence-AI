"""LangGraph pipeline graph definition.

Stub: The actual graph nodes will be implemented separately.
This file defines the graph structure and wiring.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def run_pipeline(session_id: str, input_text: str, input_url: str | None = None):
    """Run the full verification pipeline.

    This is a stub that will be replaced with the full LangGraph graph.

    The pipeline will:
    1. Extract claims (GPT-powered CoT)
    2. Search evidence (Tavily)
    3. Verify claims (GPT-powered self-reflection)
    4. Resolve conflicts
    5. Detect AI text
    6. Detect AI media (SightEngine)
    7. Assemble final report

    Each step emits Socket.IO events for real-time progress.
    """
    logger.info("Pipeline stub called for session %s — agents not yet implemented", session_id)

    # TODO: Implement the full LangGraph pipeline
    # from langgraph.graph import StateGraph
    # from app.agents.state import VerificationState
    # from app.agents.nodes import ...
    #
    # graph = StateGraph(VerificationState)
    # graph.add_node("extract_claims", extract_claims_node)
    # graph.add_node("search_evidence", search_evidence_node)
    # graph.add_node("verify_claims", verify_claims_node)
    # graph.add_node("resolve_conflicts", resolve_conflicts_node)
    # graph.add_node("detect_ai_text", detect_ai_text_node)
    # graph.add_node("detect_ai_media", detect_ai_media_node)
    # graph.add_node("assemble_report", assemble_report_node)
    #
    # graph.add_edge("extract_claims", "search_evidence")
    # graph.add_edge("search_evidence", "verify_claims")
    # graph.add_edge("verify_claims", "resolve_conflicts")
    # graph.add_edge("resolve_conflicts", "detect_ai_text")
    # graph.add_edge("detect_ai_text", "detect_ai_media")
    # graph.add_edge("detect_ai_media", "assemble_report")
    #
    # graph.set_entry_point("extract_claims")
    # graph.set_finish_point("assemble_report")
    #
    # compiled = graph.compile()
    # result = await compiled.ainvoke(initial_state)

    raise NotImplementedError("Agent pipeline not yet implemented")
