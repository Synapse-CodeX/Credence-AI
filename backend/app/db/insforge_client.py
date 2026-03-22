"""InsForge database client — PostgREST API operations via httpx."""

import json
import logging
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.models.schemas import (
    HistoryItem,
    Report,
    SessionStatus,
)

logger = logging.getLogger(__name__)

# ─── Helpers ─────────────────────────────────────────────────────────────────


def _base_url() -> str | None:
    """Return the InsForge PostgREST base URL, or None if not configured."""
    if not settings.insforge_url or not settings.insforge_api_key:
        logger.warning("InsForge credentials not configured — DB operations will be no-ops")
        return None
    # PostgREST endpoint lives at {oss_host}/api/database/records
    return settings.insforge_url.rstrip("/")


def _headers() -> dict[str, str]:
    """Standard headers for every InsForge request."""
    return {
        "Authorization": f"Bearer {settings.insforge_api_key}",
        "Content-Type": "application/json",
    }


def _records_url(table: str) -> str:
    """URL for CRUD operations on a specific table."""
    return f"{_base_url()}/api/database/records/{table}"


# ─── Session CRUD ────────────────────────────────────────────────────────────


async def create_session(
    session_id: str,
    input_text: str,
    input_url: str | None = None,
    user_id: str | None = None,
) -> bool:
    """Create a new verification session."""
    base = _base_url()
    if base is None:
        return False

    try:
        payload = {
            "id": session_id,
            "input_text": input_text[:10000],
            "input_url": input_url,
            "status": SessionStatus.PROCESSING.value,
        }
        if user_id:
            payload["user_id"] = user_id

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                _records_url("verification_sessions"),
                headers=_headers(),
                json=payload,
            )
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Failed to create session %s: %s", session_id, exc)
        return False


async def update_session_status(
    session_id: str,
    status: SessionStatus,
    report: Report | None = None,
    ai_text_score: float | None = None,
) -> bool:
    """Update session status and optionally store the report."""
    base = _base_url()
    if base is None:
        return False

    try:
        data: dict = {"status": status.value}
        if report is not None:
            data["report"] = json.loads(report.model_dump_json())
        if ai_text_score is not None:
            data["ai_text_score"] = ai_text_score

        url = _records_url("verification_sessions") + f"?id=eq.{session_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(
                url,
                headers=_headers(),
                json=data,
            )
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Failed to update session %s: %s", session_id, exc)
        return False


async def get_session(session_id: str) -> dict | None:
    """Fetch a single verification session."""
    base = _base_url()
    if base is None:
        return None

    try:
        url = _records_url("verification_sessions") + f"?id=eq.{session_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()

        rows = resp.json()
        if isinstance(rows, list) and len(rows) > 0:
            return rows[0]
        # Some PostgREST responses may return a dict directly
        if isinstance(rows, dict):
            return rows
        return None
    except Exception as exc:
        logger.error("Failed to get session %s: %s", session_id, exc)
        return None


async def get_history(
    limit: int = 20,
    offset: int = 0,
    user_id: str | None = None,
) -> tuple[list[HistoryItem], int]:
    """Fetch past verification sessions for the history page."""
    base = _base_url()
    if base is None:
        return [], 0

    try:
        hdrs = _headers()
        # Request exact count via Prefer header
        hdrs["Prefer"] = "count=exact"

        params = {
            "select": "id,input_text,input_url,status,report,ai_text_score,created_at",
            "order": "created_at.desc",
            "limit": str(limit),
            "offset": str(offset),
        }
        if user_id:
            params["user_id"] = f"eq.{user_id}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                _records_url("verification_sessions"),
                headers=hdrs,
                params=params,
            )
            resp.raise_for_status()

        rows = resp.json()

        # Extract total count from Content-Range header (PostgREST standard)
        total = 0
        content_range = resp.headers.get("Content-Range", "")
        if "/" in content_range:
            try:
                total = int(content_range.split("/")[-1])
            except ValueError:
                total = len(rows)
        else:
            total = len(rows)

        items = []
        for row in rows:
            report_data = row.get("report")
            overall_accuracy = None
            claim_count = 0
            if report_data and isinstance(report_data, dict):
                overall_accuracy = report_data.get("overall_accuracy")
                claim_count = len(report_data.get("claims", []))

            items.append(HistoryItem(
                session_id=row["id"],
                input_text=(row.get("input_text") or "")[:200],
                input_url=row.get("input_url"),
                status=row.get("status", "unknown"),
                overall_accuracy=overall_accuracy,
                claim_count=claim_count,
                created_at=row.get("created_at"),
            ))

        return items, total
    except Exception as exc:
        logger.error("Failed to get history: %s", exc)
        return [], 0


# ─── Claim Cache ─────────────────────────────────────────────────────────────


async def cache_claim_verdict(
    claim_text: str,
    claim_hash: str,
    verdict: str,
    confidence: float,
    evidence: list[dict],
) -> bool:
    """Cache a claim verdict for deduplication (upsert by claim_hash)."""
    base = _base_url()
    if base is None:
        return False

    try:
        payload = {
            "claim_text": claim_text,
            "claim_hash": claim_hash,
            "verdict": verdict,
            "confidence": confidence,
            "evidence": evidence,
        }
        # Upsert: on conflict of claim_hash, update the row
        url = _records_url("claims_cache") + "?on_conflict=claim_hash"
        hdrs = _headers()
        hdrs["Prefer"] = "resolution=merge-duplicates"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                url,
                headers=hdrs,
                json=payload,
            )
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Failed to cache claim: %s", exc)
        return False


async def get_cached_claim(claim_hash: str) -> dict | None:
    """Check if a claim verdict is already cached and not expired."""
    base = _base_url()
    if base is None:
        return None

    try:
        url = _records_url("claims_cache") + f"?claim_hash=eq.{claim_hash}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()

        rows = resp.json()
        if not rows or (isinstance(rows, list) and len(rows) == 0):
            return None

        row = rows[0] if isinstance(rows, list) else rows
        if row.get("expires_at"):
            expires = datetime.fromisoformat(row["expires_at"])
            if expires < datetime.now(timezone.utc):
                return None  # expired
        return row
    except Exception:
        return None
