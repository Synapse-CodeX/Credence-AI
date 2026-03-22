"""Socket.IO server and event handlers for real-time pipeline progress."""

import logging
from datetime import datetime, timezone

import socketio

logger = logging.getLogger(__name__)

# Create the Socket.IO async server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=120,
    ping_interval=25,
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid: str, environ: dict):
    logger.info("Client connected: %s", sid)


@sio.event
async def disconnect(sid: str):
    logger.info("Client disconnected: %s", sid)


ACTIVE_SESSIONS: set[str] = set()

@sio.event
async def join_session(sid: str, data: dict):
    """Client joins a verification session room to receive updates."""
    session_id = data.get("session_id") if isinstance(data, dict) else data
    if session_id:
        sio.enter_room(sid, session_id)
        ACTIVE_SESSIONS.add(session_id)
        logger.info("Client %s joined session %s", sid, session_id)
        await sio.emit(
            "joined",
            {"session_id": session_id, "message": "Listening for updates"},
            room=sid,
        )


@sio.event
async def leave_session(sid: str, data: dict):
    """Client leaves a verification session room."""
    session_id = data.get("session_id") if isinstance(data, dict) else data
    if session_id:
        sio.leave_room(sid, session_id)
        logger.info("Client %s left session %s", sid, session_id)


# ─── Helper functions for emitting pipeline events ──────────────────────────

async def emit_progress(
    session_id: str,
    step: str,
    status: str,
    data: dict | None = None,
):
    """Emit a pipeline progress event to all clients in a session room."""
    await sio.emit(
        "pipeline_progress",
        {
            "step": step,
            "status": status,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        room=session_id,
    )


async def emit_complete(session_id: str, report: dict):
    """Emit pipeline completion event with the full report."""
    await sio.emit(
        "pipeline_complete",
        {
            "session_id": session_id,
            "report": report,
        },
        room=session_id,
    )


async def emit_error(session_id: str, error: str):
    """Emit pipeline error event."""
    await sio.emit(
        "pipeline_error",
        {
            "session_id": session_id,
            "error": error,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        room=session_id,
    )
