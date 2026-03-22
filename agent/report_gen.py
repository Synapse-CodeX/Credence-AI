
from agent_state import AgentState, ClaimExtractionOutput, Claim, EvidenceSource, VerificationResult

def generate_report(state: AgentState) -> dict:
    print("\n[Agent 4] Generating final report...")

    report_lines = []

    # -----------------------------
    # SUMMARY CALCULATION
    # -----------------------------
    total = len(state.verifications)
    true_count = sum(1 for v in state.verifications.values() if v.verdict == "True")
    false_count = sum(1 for v in state.verifications.values() if v.verdict == "False")
    partial_count = sum(1 for v in state.verifications.values() if v.verdict == "Partially True")
    unverifiable_count = sum(1 for v in state.verifications.values() if v.verdict == "Unverifiable")

    # -----------------------------
    # HEADER
    # -----------------------------
    report_lines.append("===== FACT VERIFICATION REPORT =====\n")

    report_lines.append("Summary:")
    report_lines.append(f"- Total Claims: {total}")
    report_lines.append(f"- True: {true_count}")
    report_lines.append(f"- False: {false_count}")
    report_lines.append(f"- Partially True: {partial_count}")
    report_lines.append(f"- Unverifiable: {unverifiable_count}")
    report_lines.append("\n" + "=" * 50 + "\n")

    # -----------------------------
    # DETAILED CLAIMS
    # -----------------------------
    for claim in state.claims:
        verification = state.verifications.get(claim.id)

        if not verification:
            continue

        report_lines.append(f"Claim {claim.id}: {claim.claim}")
        report_lines.append(f"Verdict: {verification.verdict}")
        report_lines.append(f"Confidence: {round(verification.confidence, 2)}")
        report_lines.append(f"Reason: {verification.reason}")

        # Supporting sources
        if verification.supporting_sources:
            report_lines.append("Supporting Sources:")
            for url in verification.supporting_sources:
                report_lines.append(f" - {url}")

        # Conflicting sources
        if verification.conflicting_sources:
            report_lines.append("Conflicting Sources:")
            for url in verification.conflicting_sources:
                report_lines.append(f" - {url}")

        # Uncertainty
        if verification.uncertainty_reason:
            report_lines.append(f"Uncertainty: {verification.uncertainty_reason}")

        report_lines.append("\n" + "-" * 50 + "\n")

    final_report = "\n".join(report_lines)

    print("Report generated.")

    return {"final_report": final_report}