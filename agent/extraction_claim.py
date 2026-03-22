from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult
from dotenv import load_dotenv
import os   
load_dotenv()
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

def extract_claims(state: AgentState) -> dict:
   print("\n[Agent 1] Extracting claims...")
   prompt = f"""
Extract clear, atomic, and verifiable claims from the given text.

Guidelines:
- Extract ALL statements that can be fact-checked (even if they may be false)
- Do NOT filter based on correctness
- Include incorrect or absurd claims if they are verifiable
- Ignore opinions and vague statements only

- Break complex sentences into standalone claims
- Avoid duplicates
- Limit to 5–10 most important claims

For each claim:
- Assign type: factual, numerical, temporal, entity
- Provide confidence score based on clarity (NOT truth)

Text:
{state.input_text}
"""
   structured_llm = llm.with_structured_output(ClaimExtractionOutput)
   try:
      response: ClaimExtractionOutput = structured_llm.invoke(prompt)

      # POST-PROCESSING
      claims: list[Claim] = []
      seen = set()
      new_id = 1  # ensure clean sequential IDs

      for c in response.claims:
         claim_text = c.claim.strip().rstrip(".").strip()

         # deduplicate
         if claim_text.lower() in seen:
               continue
         seen.add(claim_text.lower())

         # filter low confidence
         if c.confidence < 0.5:
               continue

         # keep as Pydantic object
         claims.append(
               Claim(
                  id=new_id,
                  claim=claim_text,
                  type=c.type,
                  confidence=round(c.confidence, 2),
                  normalized_claim=claim_text.lower()
               )
         )

         new_id += 1

      print(f"Extracted claims: {[c.model_dump() for c in claims]}")

   except Exception as e:
      print("Extraction error:", e)
      claims = []

   return {"claims": claims}