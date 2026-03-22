from langchain_openai import ChatOpenAI
from agent_state import AgentState, VerificationResult
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

def verify_claims(state: AgentState) -> dict:
    print("\n[Agent 3] Verifying claims...")

    verifications: dict[int, VerificationResult] = {}

    structured_llm = llm.with_structured_output(VerificationResult)

    for claim in state.claims:
        sources = state.evidence.get(claim.id, [])

        # -----------------------------
        # BUILD CONTEXT
        # -----------------------------
        context = "\n".join(
            f"- {s.title}: {s.content}"
            for s in sources
        )

        # -----------------------------
        # PROMPT (UPDATED)
        # -----------------------------
        prompt = f"""
You are an expert fact-checking system.

Your task is to verify the claim strictly using ONLY the provided evidence.

---------------------
Claim:
{claim.claim}

Evidence:
{context}
---------------------

Instructions:
- Do NOT use prior knowledge or assumptions
- Base your decision ONLY on the given evidence
- If evidence is missing, weak, or irrelevant → return "Unverifiable"

Judgment Rules:
- TRUE → Claim is clearly supported by strong and consistent evidence
- FALSE → Claim is clearly contradicted by strong evidence
- PARTIALLY TRUE → Claim contains both correct and incorrect/misleading elements
- UNVERIFIABLE → Not enough reliable evidence

Important Guidelines:
- A claim that is generally true (even with rare exceptions) → classify as TRUE
- Do NOT mark something as "Partially True" just because of minor edge cases
- Prefer high-quality and consistent evidence over isolated statements
- Ignore unreliable or weak sources if stronger evidence exists

Evidence Handling:
- Identify supporting evidence only
- Do NOT include conflicting sources unless there is a clear contradiction

Confidence:
- High (0.9–1.0) → strong agreement across multiple reliable sources
- Medium (0.6–0.89) → moderate or slightly mixed evidence
- Low (0.0–0.59) → weak, limited, or unclear evidence

Return your answer strictly in the required structured format.
"""

        try:
            result: VerificationResult = structured_llm.invoke(prompt)

            # -----------------------------
            # SOURCE SELECTION (CLEAN)
            # -----------------------------
            urls = [s.url for s in sources]

            # remove duplicate domains
            seen_domains = set()
            filtered_urls = []

            for url in urls:
                try:
                    domain = url.split("/")[2]
                except:
                    continue

                if domain not in seen_domains:
                    seen_domains.add(domain)
                    filtered_urls.append(url)

            result.supporting_sources = filtered_urls[:3]

            # -----------------------------
            # REMOVE CONFLICTING SOURCES
            # -----------------------------
            result.conflicting_sources = []

            # -----------------------------
            # CONFIDENCE CONTROL (IMPORTANT)
            # -----------------------------
            # cap unrealistic 1.0 values
            result.confidence = min(result.confidence, 0.95)

            # adjust based on evidence strength
            if len(sources) < 3:
                result.confidence = max(result.confidence - 0.05, 0.5)

            verifications[claim.id] = result

        except Exception as e:
            print(f"Verification error for claim {claim.id}:", e)

            verifications[claim.id] = VerificationResult(
                verdict="Unverifiable",
                confidence=0.0,
                reason="Verification failed due to parsing error",
                supporting_sources=[],
                conflicting_sources=[],
                uncertainty_reason="System error"
            )

    print("Verifications completed.")

    return {"verifications": verifications}