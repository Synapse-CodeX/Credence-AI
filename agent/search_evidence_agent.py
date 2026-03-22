from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from langchain_openai import ChatOpenAI
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult
import os
from dotenv import load_dotenv   
from tavily import TavilyClient
load_dotenv()
search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search_evidence(state: AgentState) -> dict:
    print("\n[Agent 2] Searching for evidence...")

    evidence: dict[int, list[EvidenceSource]] = {}

    # -----------------------------
    # DOMAIN FILTERS
    # -----------------------------
    bad_domains = ["facebook", "instagram", "reddit", "yelp", "example.com"]

    trusted_domains = ["bbc", "reuters", "who", "un", "gov", "nature", "apnews", "npr"]

    for claim_obj in state.claims:
        claim_text = claim_obj.claim
        claim_type = claim_obj.type
        confidence = claim_obj.confidence

        if confidence < 0.5:
            continue

        # -----------------------------
        # QUERY STRATEGY
        # -----------------------------
        if claim_type == "numerical":
            queries = [
                f"{claim_text} statistics",
                f"{claim_text} official data",
            ]
        elif claim_type == "temporal":
            queries = [
                f"{claim_text} timeline",
                f"{claim_text} date",
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
                    url = r.get("url", "")

                    # ❌ FILTER BAD SOURCES
                    if any(b in url for b in bad_domains):
                        continue

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
        # RANKING (IMPROVED)
        # -----------------------------
        def score_result(r):
            score = 0
            content = (r.get("content") or "").lower()
            title = (r.get("title") or "").lower()
            url = r.get("url") or ""

            # keyword match
            if any(word in content for word in claim_text.lower().split()):
                score += 1
            if any(word in title for word in claim_text.lower().split()):
                score += 1

            # trusted domain boost
            if any(t in url for t in trusted_domains):
                score += 3

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
                score=r.get("score"),
                query_used=r.get("query_used"),
                credibility=1.0 if any(t in (r.get("url") or "") for t in trusted_domains) else 0.5
            )
            for r in ranked[:5]
        ]

    print("Evidence collected.")

    return {"evidence": evidence}
