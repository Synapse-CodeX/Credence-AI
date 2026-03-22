
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult

def generate_report(state: AgentState) -> dict:
    print("\n[Agent 4] Generating final report...")

    report_lines = []
    report_lines.append("===== FACT VERIFICATION REPORT =====\n")

    for claim in state.claims:
        verification = state.verifications.get(claim.id)

        if not verification:
            continue

        # -----------------------------
        # FORMAT CLAIM HEADER
        # -----------------------------
        report_lines.append(f"Claim {claim.id}: {claim.claim}")

        # -----------------------------
        # VERDICT
        # -----------------------------
        report_lines.append(f"Verdict: {verification.verdict}")
        report_lines.append(f"Confidence: {round(verification.confidence, 2)}")

        # -----------------------------
        # REASON
        # -----------------------------
        report_lines.append(f"Reason: {verification.reason}")

        # -----------------------------
        # SUPPORTING SOURCES
        # -----------------------------
        if verification.supporting_sources:
            report_lines.append("Supporting Sources:")
            for url in verification.supporting_sources:
                report_lines.append(f" - {url}")

        # -----------------------------
        # CONFLICTING SOURCES
        # -----------------------------
        if verification.conflicting_sources:
            report_lines.append("Conflicting Sources:")
            for url in verification.conflicting_sources:
                report_lines.append(f" - {url}")

        # -----------------------------
        # UNCERTAINTY
        # -----------------------------
        if verification.uncertainty_reason:
            report_lines.append(f"Uncertainty: {verification.uncertainty_reason}")

        report_lines.append("\n" + "-" * 50 + "\n")

    final_report = "\n".join(report_lines)

    print("Report generated.")

    return {"final_report": final_report}