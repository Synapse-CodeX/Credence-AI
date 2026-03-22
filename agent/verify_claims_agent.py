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
        # PROMPT (IMPROVED)
        # -----------------------------
        prompt = f"""
        You are a fact-checking system.

        Verify the claim using ONLY the provided evidence.

        Claim:
        {claim.claim}

        Evidence:
        {context}

        Instructions:
        - Do NOT use prior knowledge
        - Base decision strictly on evidence
        - If evidence is insufficient → Unverifiable
        - Identify both supporting and conflicting evidence
        - Be conservative in judgment

        """

        try:
            result: VerificationResult = structured_llm.invoke(prompt)

            # -----------------------------
            # OPTIONAL: attach source URLs
            # -----------------------------
            urls = [s.url for s in sources]

            result.supporting_sources = urls[:3]

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