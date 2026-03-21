import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from typing import List, Dict, Any,Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from tavily import TavilyClient
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult 
from extraction_claim import extract_claims
load_dotenv()

# -----------------------------
# INIT MODELS
# -----------------------------
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))



# -----------------------------
# AGENT 1: CLAIM EXTRACTION
# -----------------------------



# -----------------------------
# AGENT 2: SEARCH
# -----------------------------
def search_evidence(state: AgentState) -> dict:
    print("\n[Agent 2] Searching for evidence...")

    evidence = {}

    for claim_obj in state.claims:
        claim_text = claim_obj["claim"]
        claim_type = claim_obj["type"]
        confidence = claim_obj["confidence"]

        # -----------------------------
        # SKIP LOW CONFIDENCE CLAIMS
        # -----------------------------
        if confidence < 0.5:
            continue

        # -----------------------------
        # QUERY STRATEGY (TYPE-BASED)
        # -----------------------------
        queries = []

        if claim_type == "numerical":
            queries = [
                f"{claim_text} statistics",
                f"{claim_text} official data",
                f"{claim_text} report",
            ]

        elif claim_type == "temporal":
            queries = [
                f"{claim_text} date event",
                f"{claim_text} when happened",
                f"{claim_text} timeline",
            ]

        elif claim_type == "entity":
            queries = [
                f"{claim_text} who is",
                f"{claim_text} information",
                f"{claim_text} details",
            ]

        else:  # factual default
            queries = [claim_text, f"{claim_text} evidence", f"{claim_text} facts"]

        # -----------------------------
        # MULTI-SEARCH
        # -----------------------------
        all_results = []

        for q in queries:
            try:
                res = search_client.search(query=q, max_results=3)
                results = res.get("results", [])

                for r in results:
                    r["query_used"] = q  # track origin
                    all_results.append(r)

            except Exception as e:
                print(f"Search error for query '{q}':", e)

        # -----------------------------
        # DEDUPLICATE (by URL)
        # -----------------------------
        seen_urls = set()
        unique_results = []

        for r in all_results:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(r)

        # -----------------------------
        # RANK RESULTS (simple scoring)
        # -----------------------------
        def score_result(r):
            score = 0

            # boost if claim words appear
            content = (r.get("content") or "").lower()
            title = (r.get("title") or "").lower()

            if any(word in content for word in claim_text.lower().split()):
                score += 1

            if any(word in title for word in claim_text.lower().split()):
                score += 1

            # boost trusted domains
            trusted = ["bbc", "reuters", "who", "un", "gov", "nature"]
            if any(t in (r.get("url") or "") for t in trusted):
                score += 2

            return score

        ranked = sorted(unique_results, key=score_result, reverse=True)

        # -----------------------------
        # LIMIT FINAL RESULTS
        # -----------------------------
        evidence[claim_text] = ranked[:5]

    print("Evidence collected.")

    return {"evidence": evidence}

# -----------------------------
# AGENT 3: VERIFICATION
# -----------------------------
def verify_claims(state: AgentState) -> dict:
    print("\n[Agent 3] Verifying claims...")
    verifications = {}

    for claim in state.claims:
        sources = state.evidence.get(claim, [])

        context = "\n".join(
            f"{s.get('title')}: {s.get('content')}"
            for s in sources
        )

        prompt = f"""
        Verify claim using ONLY evidence.

        Claim:
        {claim}

        Evidence:
        {context}

        Return STRICT JSON:
        {{
            "verdict": "True / False / Partially True / Unverifiable",
            "confidence": float,
            "reason": "short explanation"
        }}
        """

        response = llm.invoke(prompt).content

        # optional: try parsing JSON safely
        verifications[claim] = {
            "raw": response
        }

    print(f"Verifications completed: {verifications}")

    return {"verifications": verifications}

# -----------------------------
# FINAL REPORT
# -----------------------------
def generate_report(state: AgentState) -> dict:
    report_lines = []

    for i, claim in enumerate(state.claims, 1):
        report_lines.append(f"\nClaim {i}: {claim}")
        report_lines.append(f"Analysis: {state.verifications.get(claim)}")

    return {"final_report": "\n".join(report_lines)}


# -----------------------------
# BUILD GRAPH
# -----------------------------
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

graph = builder.compile()


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    initial_state = AgentState(
        input_text="""
        India became the most populous country in 2023.
        The moon is made of cheese.
        """
    )

    result = graph.invoke(initial_state)

    print("\n===== FINAL REPORT =====\n")
    print(result["final_report"])