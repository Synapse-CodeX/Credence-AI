from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult
import os
from dotenv import load_dotenv   
from tavily import TavilyClient
load_dotenv()
search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search_evidence(state: AgentState) -> dict:
    print("\n[Agent 2] Searching for evidence...")

    evidence: dict[int, list[EvidenceSource]] = {}

    for claim_obj in state.claims:
        claim_text = claim_obj.claim
        claim_type = claim_obj.type
        confidence = claim_obj.confidence

        # skip low confidence
        if confidence < 0.3:
            continue

        # -----------------------------
        # QUERY STRATEGY
        # -----------------------------
        if claim_type == "numerical":
            queries = [
                f"{claim_text} statistics",
                f"{claim_text} official data",
                f"{claim_text} report",
            ]

        elif claim_type == "temporal":
            queries = [
                f"{claim_text} date event",
                f"{claim_text} timeline",
            ]

        elif claim_type == "entity":
            queries = [
                f"{claim_text} who is",
                f"{claim_text} details",
            ]

        else:
            queries = [
                claim_text,
                f"{claim_text} facts",
            ]

        # -----------------------------
        # SEARCH
        # -----------------------------
        all_results = []

        for q in queries:
            try:
                res = search_client.search(query=q, max_results=3)
                results = res.get("results", [])

                for r in results:
                    r["query_used"] = q
                    all_results.append(r)

            except Exception as e:
                print(f"Search error for '{q}':", e)

        # -----------------------------
        # DEDUPLICATE
        # -----------------------------
        seen_urls = set()
        unique_results = []

        for r in all_results:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(r)

        # -----------------------------
        # RANK
        # -----------------------------
        def score_result(r):
            score = 0
            content = (r.get("content") or "").lower()
            title = (r.get("title") or "").lower()

            if claim_text.lower() in content:
                score += 1
            if claim_text.lower() in title:
                score += 1

            trusted = ["bbc", "reuters", "who", "un", "gov", "nature"]
            if any(t in (r.get("url") or "") for t in trusted):
                score += 2

            return score

        ranked = sorted(unique_results, key=score_result, reverse=True)

        # -----------------------------
        # CONVERT TO PYDANTIC
        # -----------------------------
        evidence[claim_obj.id] = [
            EvidenceSource(
                title=r.get("title", ""),
                content=r.get("content", ""),
                url=r.get("url", ""),
                relevance_score=r.get("score"),
                query_used=r.get("query_used"),
            )
            for r in ranked[:5]
        ]

    print("Evidence collected.")

    return {"evidence": evidence}
