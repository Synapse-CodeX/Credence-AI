import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from typing import List, Dict, Any,Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from langgraph.graph import StateGraph, END
from tavily import TavilyClient
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult 
from extraction_claim import extract_claims
from search_evidence_agent import search_evidence
from verify_claims_agent import verify_claims
from report_gen import generate_report
load_dotenv()

# -----------------------------
# INIT MODELS
# -----------------------------
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2,api_key=os.getenv("OPENAI_API_KEY"))
search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


# -----------------------------
# AGENT 1: CLAIM EXTRACTION

# AGENT 2: SEARCH

# AGENT 3: VERIFICATION

# FINAL REPORT
# -----------------------------


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
# RUN + DEBUG TEST
# -----------------------------
if __name__ == "__main__":
    print("\n🚀 Starting Agent Test...\n")

    initial_state = AgentState(
        input_text="""
        In 2023, India surpassed China to become the most populous country in the world, according to United Nations estimates. The country’s population was reported to exceed 1.4 billion people, marking a significant demographic shift. Meanwhile, scientists have long confirmed that the Moon is composed primarily of rock and not cheese, despite popular myths. In the field of technology, Apple was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976, and it later became one of the most valuable companies globally. Some online sources incorrectly claim that humans only use 10% of their brain, but neuroscientific research has disproven this myth. Additionally, the Eiffel Tower is located in Berlin, a statement often seen in misinformation examples, even though it is actually in Paris. During the COVID-19 pandemic, vaccines were developed in under a year, which was significantly faster than previous vaccine development timelines. However, claims that vaccines contain microchips for tracking people have been widely debunked by scientific and regulatory authorities.
        """
    )

    try:
        result = graph.invoke(initial_state)

        print("\n==============================")
        print("🧠 DEBUG: INTERNAL STATE")
        print("==============================")

        # -----------------------------
        # CLAIMS
        # -----------------------------
        print("\n📌 Claims:")
        for c in result["claims"]:
            print(f" - ID: {c.id}, Claim: {c.claim}, Type: {c.type}, Confidence: {c.confidence}")

        # -----------------------------
        # EVIDENCE
        # -----------------------------
        print("\n🔎 Evidence:")
        for claim_id, sources in result["evidence"].items():
            print(f"\nClaim ID {claim_id}:")
            for s in sources:
                print(f"  • {s.title}")
                print(f"    URL: {s.url}")

        # -----------------------------
        # VERIFICATIONS
        # -----------------------------
        print("\n✅ Verifications:")
        for claim_id, v in result["verifications"].items():
            print(f"\nClaim ID {claim_id}:")
            print(f"  Verdict: {v.verdict}")
            print(f"  Confidence: {v.confidence}")
            print(f"  Reason: {v.reason}")

        # -----------------------------
        # FINAL REPORT
        # -----------------------------
        print("\n==============================")
        print("📊 FINAL REPORT")
        print("==============================\n")

        print(result["final_report"])

    except Exception as e:
        print("\n❌ ERROR DURING EXECUTION")
        print(e)