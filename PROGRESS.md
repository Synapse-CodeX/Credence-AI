# 📋 Factify — Progress Log

---

## Session 1 — 2026-03-21

### ✅ AI Image Detection (SightEngine) — Backend

**Files Created:**

| File | Purpose |
|---|---|
| `backend/app/__init__.py` | Package init |
| `backend/app/main.py` | FastAPI app entrypoint, CORS, router mounting |
| `backend/app/config.py` | `pydantic-settings` config (switchable LLM, SightEngine creds, etc.) |
| `backend/app/models/__init__.py` | Package init |
| `backend/app/models/schemas.py` | Pydantic models: `MediaDetectionRequest`, `MediaDetectionResult`, `BatchMediaDetectionRequest`, `MediaDetectionResponse` |
| `backend/app/services/__init__.py` | Package init |
| `backend/app/services/ai_media_detector.py` | SightEngine API integration — single + batch image detection with confidence scoring |
| `backend/app/routes/__init__.py` | Package init |
| `backend/app/routes/detect_media.py` | `POST /api/detect-media/image` (single) + `POST /api/detect-media/images` (batch, max 20) |
| `backend/app/routes/health.py` | `GET /api/health` |
| `backend/pyproject.toml` | Project config + FastAPI entrypoint |
| `backend/.env` | SightEngine credentials + CORS config |
| `backend/.env.example` | Template env file |

**Dependencies Installed:**
`fastapi[standard]`, `httpx`, `pydantic-settings`, `python-dotenv`

**API Endpoints Available:**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/detect-media/image` | Check single image (body: `{"image_url": "..."}`) |
| `POST` | `/api/detect-media/images` | Check up to 20 images (body: `{"image_urls": ["...", ...]}`) |

**Key Design Notes:**
- Uses **HTTPX** (async) for SightEngine API calls
- Switchable LLM config via `LLM_BASE_URL` env var (OpenAI-compatible)
- Follows FastAPI best practices: `Annotated` style, return types, router-level prefixes

**✅ Tested & Verified:**
- Server running via `uv run fastapi dev app/main.py --port 8000`
- Swagger UI accessible at `http://localhost:8000/docs`
- `POST /api/detect-media/image` tested with SightEngine example image:
  ```json
  // Request
  {"image_url": "https://sightengine.com/assets/img/examples/example-prop-c1.jpg"}

  // Response (200 OK)
  {
    "image_url": "https://sightengine.com/assets/img/examples/example-prop-c1.jpg",
    "ai_generated_score": 0.01,
    "verdict": "Likely Real",
    "confidence": "HIGH"
  }
  ```

---

### ✅ Full Backend Infrastructure — 2026-03-22

**New Files Created:**

| File | Purpose |
|---|---|
| `backend/app/models/schemas.py` | **Expanded** — full domain models: `Claim`, `Evidence`, `Verdict`, `Report`, `AITextResult`, `ScrapedContent`, enums (`VerdictEnum`, `ClaimCategory`, `SessionStatus`), API schemas (`VerifyRequest/Response`, `ReportResponse`, `HistoryItem/Response`), Socket.IO event models |
| `backend/app/services/scraper.py` | HTTPX async URL scraper + BeautifulSoup text/image extraction |
| `backend/app/services/ai_text_detector.py` | LLM-based AI text detection via switchable OpenAI client |
| `backend/app/sockets/__init__.py` | Package init |
| `backend/app/sockets/events.py` | Socket.IO server — room-based sessions, `emit_progress`, `emit_complete`, `emit_error` helpers |
| `backend/app/routes/verify.py` | `POST /api/verify` — accepts text/URL, scrapes URL, creates DB session |
| `backend/app/routes/report.py` | `GET /api/report/{session_id}` — fetches report from InsForge |
| `backend/app/routes/history.py` | `GET /api/history` — paginated history of past verifications |
| `backend/app/db/__init__.py` | Package init |
| `backend/app/db/supabase_client.py` | ~~Supabase client~~ → replaced by `insforge_client.py` in migration below |
| `backend/app/agents/__init__.py` | Package init |
| `backend/app/agents/state.py` | LangGraph `VerificationState` TypedDict — pipeline state schema |
| `backend/app/agents/graph.py` | Pipeline stub with full LangGraph wiring pseudocode |

**Modified Files:**

| File | Change |
|---|---|
| `backend/app/main.py` | Rewrote: FastAPI `api` wrapped by `socketio.ASGIApp` as `app`, added all routers + logging |
| `backend/app/config.py` | Added `debug` flag |
| `backend/pyproject.toml` | Added deps: `python-socketio`, `openai`, `beautifulsoup4` |
| `backend/.env` | Added commented-out LLM, Tavily config placeholders |

**All API Endpoints (6 total):**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/verify` | Submit text/URL → returns `session_id` |
| `GET` | `/api/report/{session_id}` | Fetch verification report |
| `GET` | `/api/history` | Paginated past sessions |
| `POST` | `/api/detect-media/image` | SightEngine AI image check (single) |
| `POST` | `/api/detect-media/images` | SightEngine AI image check (batch) |
| `WS` | `/socket.io/` | Real-time pipeline progress |

**✅ Tested & Verified:**
- Server running via `uv run uvicorn app.main:app --reload --port 8000`
- All 5 endpoint groups visible in Swagger UI: Health, Verification, Reports, History, AI Media Detection
- `GET /api/health` → `200 {"status": "ok"}`
- `POST /api/verify` with `{"url": "https://en.wikipedia.org/wiki/Earth"}` → `200`, returns `session_id`, URL scraped successfully

**Still TODO (agents):**
- LangGraph pipeline nodes: extractor, searcher, verifier, conflict resolver, reporter
- Wire `run_pipeline` in `graph.py` to the `/api/verify` route background task

---

### ✅ Supabase → InsForge Migration — 2026-03-22

**Platform:** Switched from Supabase to [InsForge](https://insforge.app) as the backend-as-a-service platform.

**InsForge Project:**

| Property | Value |
|---|---|
| Project | `gfg` (`0ca25584-61c6-4635-9f13-475760102426`) |
| Region | `ap-southeast` |
| OSS Host | `https://v33zy7f3.ap-southeast.insforge.app` |

**Database Tables Created (via `insforge db query`):**

| Table | Columns |
|---|---|
| `verification_sessions` | `id` (UUID PK), `input_text`, `input_url`, `status`, `report` (JSONB), `ai_text_score`, `created_at`, `updated_at` |
| `claims_cache` | `id` (UUID PK), `claim_text`, `claim_hash` (UNIQUE + indexed), `verdict`, `confidence`, `evidence` (JSONB), `created_at`, `expires_at` (24h TTL) |

- `updated_at` trigger via `system.update_updated_at()` on `verification_sessions`
- Index `idx_claims_cache_hash` on `claims_cache(claim_hash)`

**Files Created:**

| File | Purpose |
|---|---|
| `backend/app/db/insforge_client.py` | InsForge PostgREST client via `httpx` — session CRUD, history pagination, claim caching with TTL (drop-in replacement for old `supabase_client.py`) |

**Files Modified:**

| File | Change |
|---|---|
| `backend/app/config.py` | `supabase_url`/`supabase_key` → `insforge_url`/`insforge_api_key` |
| `backend/app/routes/verify.py` | Import: `supabase_client` → `insforge_client` |
| `backend/app/routes/report.py` | Import: `supabase_client` → `insforge_client` |
| `backend/app/routes/history.py` | Import: `supabase_client` → `insforge_client` |
| `backend/.env` | Added `INSFORGE_URL` + `INSFORGE_API_KEY` (live credentials) |
| `backend/.env.example` | Updated placeholders for InsForge |
| `backend/pyproject.toml` | Removed `supabase` dependency (httpx already present) |

**Files Deleted:**

| File | Reason |
|---|---|
| `backend/app/db/supabase_client.py` | Replaced by `insforge_client.py` |

**✅ Tested & Verified:**
- `GET /api/health` → `200 {"status": "ok"}`
- `POST /api/verify` with `{"text": "The Earth is the third planet from the Sun."}` → `200`, session created, **row confirmed in InsForge DB**
- `GET /api/history` → returns session from InsForge with correct data
- `insforge db query` confirms data persisted in `verification_sessions` table

**Available InsForge AI Models:**
- `deepseek/deepseek-v3.2`, `minimax/minimax-m2.1`, `x-ai/grok-4.1-fast`, `anthropic/claude-sonnet-4.5`, `openai/gpt-4o-mini`, `google/gemini-3-pro-image-preview`
