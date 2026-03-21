# 📝 Factify — TODO

> Last updated: 2026-03-22

---

## ✅ Completed

### Backend Infrastructure
- [x] FastAPI app with CORS, Socket.IO mount, logging
- [x] Pydantic config (`pydantic-settings`, `.env` driven)
- [x] Full domain models & schemas (`schemas.py` — enums, Claim, Evidence, Verdict, Report, etc.)
- [x] URL scraper (`scraper.py` — httpx + BeautifulSoup)
- [x] AI text detector stub (`ai_text_detector.py` — OpenAI-compatible)
- [x] AI media detector (`ai_media_detector.py` — SightEngine API, single + batch)
- [x] Socket.IO events (`events.py` — room-based, emit_progress/complete/error helpers)
- [x] All API routes: `/api/health`, `/api/verify`, `/api/report/{id}`, `/api/history`, `/api/detect-media/*`
- [x] LangGraph state schema (`state.py` — `VerificationState` TypedDict)
- [x] Pipeline graph stub (`graph.py` — structure + pseudocode)

### InsForge Migration (was Supabase)
- [x] InsForge project linked (`gfg`, `ap-southeast`)
- [x] Database tables created: `verification_sessions`, `claims_cache`
- [x] `insforge_client.py` — PostgREST client via httpx (session CRUD, history, claim cache)
- [x] All routes wired to InsForge — tested end-to-end
- [x] `supabase` dependency removed

### Frontend (Existing — Older)
- [x] React app initialized (CRA)
- [x] Basic components: `FactCheckApp`, `InputBox`, `ResultCard`, `ResultsList`, `Sidebar`, `Tabs`, `TypingIndicator`
- [x] Socket.IO client (`services/socket.js`)

---

## 🔴 High Priority — Core Pipeline (Agents)

These are the **heart of Factify** — without these, the app can't verify anything.

### Agent Nodes (`backend/app/agents/nodes/`)
- [ ] **`extractor.py`** — Claim extraction node
  - Input: raw text → Output: list of `Claim` objects
  - Use GPT with Chain-of-Thought prompting
  - Decompose text into atomic, verifiable claims
  - Tag each with a `ClaimCategory` (STATISTICAL, HISTORICAL, SCIENTIFIC, etc.)
  - Use InsForge AI (`deepseek/deepseek-v3.2` or `openai/gpt-4o-mini`)

- [ ] **`searcher.py`** — Evidence retrieval node
  - Input: list of Claims → Output: `dict[claim_id, list[Evidence]]`
  - Use Tavily API for advanced web search per claim
  - Generate optimized search queries from each claim
  - Retrieve and rank evidence by relevance
  - Needs `TAVILY_API_KEY` configured in `.env`

- [ ] **`verifier.py`** — Verification & classification node
  - Input: claims + evidence → Output: list of `Verdict` objects
  - Use GPT with self-reflection prompting (3-step: assess → challenge → finalize)
  - Classify each claim: TRUE / FALSE / PARTIALLY_TRUE / UNVERIFIABLE
  - Assign `confidence_score` (0–100) with cited sources

- [ ] **`conflict_resolver.py`** — Conflict resolution node
  - Handle contradictory evidence across sources
  - Weigh source authority, recency, and agreement
  - Re-evaluate verdicts where evidence conflicts

- [ ] **`reporter.py`** — Report assembly node
  - Combine all verdicts into a `Report` object
  - Calculate `overall_accuracy` percentage
  - Include AI text/media results if available
  - Save final report to InsForge via `update_session_status()`

### Agent Prompts (`backend/app/agents/prompts/`)
- [ ] **`extraction.py`** — CoT claim extraction prompt
- [ ] **`verification.py`** — Self-reflection verification prompt
- [ ] **`ai_detection.py`** — AI content detection prompt

### Pipeline Wiring
- [ ] **`graph.py`** — Replace stub with real LangGraph graph
  - Wire all nodes: extract → search → verify → resolve → detect_ai_text → detect_ai_media → assemble
  - Add conditional edges (skip media detection if no images, etc.)
  - Compile and expose `run_pipeline()` as async function

- [ ] **`verify.py` route** — Kick off `run_pipeline()` as a **BackgroundTask**
  - Currently just creates a session and returns — pipeline never runs
  - Add `BackgroundTasks` parameter, call `run_pipeline(session_id, text, url)`

### Dependencies
- [ ] Add `langchain`, `langchain-openai`, `langgraph`, `tavily-python` to `pyproject.toml`
- [ ] Configure `TAVILY_API_KEY` in `.env`
- [ ] Configure LLM creds (either OpenAI or InsForge AI endpoint) in `.env`

---

## 🟡 Medium Priority — Frontend Rebuild

The current frontend is a basic CRA app. The plan calls for a polished, animated UI.

### Core Screens
- [ ] **Input Page (Hero)** — textarea/URL toggle, gradient background, glassmorphism card, "Verify" button
- [ ] **Live Pipeline Viewer** — step-by-step animated progress via Socket.IO
  - 📄 Parsing → 🔍 Extracting Claims → 🌐 Searching Evidence → ✅ Verifying → 📊 Report
  - Each step animates in as it completes (this is the "wow factor")
- [ ] **Accuracy Report Page** — interactive, expandable
  - Summary header with overall accuracy score + pie chart
  - AI Detection badges
  - Claim cards with verdict badges (✅ ❌ ⚠️ ❓), confidence bars, expandable evidence
  - Chain-of-thought reasoning (collapsible)

### Components (per PLAN.md)
- [ ] `InputPanel.jsx` — text/URL input form
- [ ] `PipelineViewer.jsx` — live step-by-step progress
- [ ] `AccuracyReport.jsx` — full interactive report
- [ ] `ClaimCard.jsx` — individual claim with verdict
- [ ] `EvidencePanel.jsx` — sources & citations drawer
- [ ] `ConfidenceBadge.jsx` — confidence score visual
- [ ] `AIDetectionBadge.jsx` — AI-generated content indicator
- [ ] `Header.jsx` — app header/nav
- [ ] `History.jsx` — past verification reports

### Hooks
- [ ] `useSocket.js` — Socket.IO connection + event handling
- [ ] `useVerification.js` — API calls + state management

### Dependencies to add
- [ ] `framer-motion` — animations
- [ ] `lucide-react` — icons
- [ ] `axios` — HTTP client
- [ ] `recharts` — pie charts / visualizations
- [ ] `react-router-dom` — routing
- [ ] Consider migrating CRA → Vite for faster dev/builds

---

## 🟢 Low Priority — Polish & Production

### Bonus Features
- [ ] Wire AI text detection into the pipeline (currently a standalone service)
- [ ] Wire AI media detection into the pipeline (SightEngine is ready, just needs pipeline integration)
- [ ] Display AI detection results in the report UI with badges

### Error Handling & Resilience
- [ ] Tavily search retry with reformulated query on failure
- [ ] LLM invalid JSON retry with stricter prompt + regex fallback
- [ ] Rate limit handling with exponential backoff + jitter
- [ ] Temporal claim awareness (add "as of [date]" to search queries)

### Deployment
- [ ] Update Dockerfile for backend (remove supabase, ensure httpx)
- [ ] Update docker-compose.yml (InsForge is external, no local DB needed)
- [ ] Deploy to AWS EC2
- [ ] Nginx reverse proxy config (`/` → frontend, `/api/` → backend, `/socket.io/` → backend WS)
- [ ] Set production env vars

### Demo Prep
- [ ] Test with 3+ diverse URLs per problem statement
- [ ] Prepare demo script (10 min: 1 min intro, 2 min arch, 5 min live demo, 2 min innovation)
- [ ] Write README with setup instructions

### Cleanup
- [ ] Update PLAN.md — replace Supabase refs with InsForge
- [ ] Delete old `supabase_client.py` pycache if lingering
- [ ] Add `.insforge/` to `.gitignore` (contains API keys)

---

## 📌 Quick Reference

### InsForge Project
| Key | Value |
|-----|-------|
| Project | `gfg` |
| Region | `ap-southeast` |
| OSS Host | `https://v33zy7f3.ap-southeast.insforge.app` |
| AI Models | `deepseek-v3.2`, `minimax-m2.1`, `grok-4.1-fast`, `claude-sonnet-4.5`, `gpt-4o-mini`, `gemini-3-pro` |

### Run Commands
```bash
# Backend
cd backend && uv run fastapi dev app/main.py --port 8000

# Frontend
cd frontend && npm start

# InsForge DB
insforge db tables
insforge db query "SELECT * FROM verification_sessions LIMIT 5"
```
