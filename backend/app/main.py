import logging

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.detect_media import router as detect_media_router
from app.routes.detect_text import router as detect_text_router
from app.routes.health import router as health_router
from app.routes.history import router as history_router
from app.routes.report import router as report_router
from app.routes.verify import router as verify_router

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

# ─── FastAPI app ─────────────────────────────────────────────────────────────

api = FastAPI(
    title="Factify API",
    description="AI-based Fact-Check & Claim Verification System",
    version="0.1.0",
)

# CORS
api.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────

api.include_router(health_router)
api.include_router(verify_router)
api.include_router(report_router)
api.include_router(history_router)
api.include_router(detect_media_router)
api.include_router(detect_text_router)

# ─── Final app ────────────────────────────────────────────────────────
app = api
