# 🔍 Factify — AI-based Fact-Check & Claim Verification System

> **Hackathon Finale Project Plan**
> Stack: FastAPI · LangChain/LangGraph · OpenAI GPT-5 · Tavily · React · Socket.IO · Supabase · AWS EC2

---

## 1. Product Vision

A web app where users paste **text** or a **URL** and get back a beautiful, interactive **Accuracy Report** — with every claim extracted, verified against live web evidence, color-coded by verdict, and backed by cited sources. Real-time streaming shows the multi-step agentic pipeline in action.

### Why We'll Win
| Criteria (Weight) | Our Edge |
|---|---|
| **Accuracy (40%)** | LangGraph multi-agent pipeline with Chain-of-Thought reasoning, self-reflection, and retry logic |
| **Aesthetics (30%)** | Live Socket.IO streaming of each pipeline step, interactive claim-to-evidence mapping, polished modern UI |
| **Innovation (30%)** | Conflict resolution agent, temporal-awareness, graceful degradation on API failures + both bonus features |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                        │
│  Input Panel ──► Live Pipeline Viewer ──► Accuracy Report    │
│                     (Socket.IO)                              │
└──────────────────────┬───────────────────────────────────────┘
                       │  HTTP + WebSocket (Socket.IO)
┌──────────────────────▼───────────────────────────────────────┐
│                     FASTAPI BACKEND                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               LANGGRAPH PIPELINE                         │ │
│  │                                                          │ │
│  │  ┌──────────┐   ┌──────────────┐   ┌────────────────┐  │ │
│  │  │ EXTRACT  │──►│   SEARCH &   │──►│   VERIFY &     │  │ │
│  │  │  CLAIMS  │   │   RETRIEVE   │   │   CLASSIFY     │  │ │
│  │  └──────────┘   └──────────────┘   └────────────────┘  │ │
│  │       │                │                    │           │ │
│  │   GPT-5 nano     Tavily API            GPT-5 mini      │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  BONUS: AI Text Detection │ AI Media Detection   │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Supabase (history, caching)                                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
finale/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, Socket.IO mount
│   │   ├── config.py                # Env vars, API keys
│   │   ├── routes/
│   │   │   ├── verify.py            # POST /api/verify — starts pipeline
│   │   │   ├── history.py           # GET /api/history — past reports
│   │   │   └── health.py            # GET /api/health
│   │   ├── services/
│   │   │   ├── scraper.py           # BeautifulSoup URL→text extractor
│   │   │   ├── ai_text_detector.py  # Bonus: AI text detection
│   │   │   └── ai_media_detector.py # Bonus: AI media detection
│   │   ├── agents/
│   │   │   ├── graph.py             # LangGraph state graph definition
│   │   │   ├── state.py             # Pydantic state schema
│   │   │   ├── nodes/
│   │   │   │   ├── extractor.py     # Claim extraction node
│   │   │   │   ├── searcher.py      # Evidence retrieval node (Tavily)
│   │   │   │   ├── verifier.py      # Verification & classification node
│   │   │   │   └── reporter.py      # Final report assembly node
│   │   │   └── prompts/
│   │   │       ├── extraction.py    # Claim extraction prompts (CoT)
│   │   │       ├── verification.py  # Verification prompts (self-reflection)
│   │   │       └── ai_detection.py  # AI content detection prompts
│   │   ├── sockets/
│   │   │   └── events.py            # Socket.IO event handlers
│   │   └── db/
│   │       └── supabase_client.py   # Supabase client + queries
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css                # Global styles
│   │   ├── components/
│   │   │   ├── InputPanel.jsx       # Text/URL input form
│   │   │   ├── PipelineViewer.jsx   # Live step-by-step progress
│   │   │   ├── AccuracyReport.jsx   # Full interactive report
│   │   │   ├── ClaimCard.jsx        # Individual claim with verdict
│   │   │   ├── EvidencePanel.jsx    # Sources & citations drawer
│   │   │   ├── ConfidenceBadge.jsx  # Confidence score visual
│   │   │   ├── AIDetectionBadge.jsx # AI-generated content indicator
│   │   │   ├── Header.jsx
│   │   │   └── History.jsx          # Past verification reports
│   │   ├── hooks/
│   │   │   ├── useSocket.js         # Socket.IO hook
│   │   │   └── useVerification.js   # API + state management
│   │   └── utils/
│   │       └── api.js               # Axios instance
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── PLAN.md
└── README.md
```

---

## 4. LangGraph Pipeline (Core Engine)

This is the heart of the project. We use **LangGraph** to build a stateful, multi-step agent graph.

### 4.1 State Schema

```python
class VerificationState(TypedDict):
    input_text: str                    # Original text or scraped content
    input_url: str | None              # Source URL if provided
    claims: list[Claim]                # Extracted atomic claims
    evidences: dict[str, list[Evidence]]  # claim_id → evidence list
    verdicts: list[Verdict]            # Final verdicts per claim
    report: Report                     # Assembled accuracy report
    ai_text_score: float | None        # Bonus: AI text probability
    ai_media_results: list | None      # Bonus: AI media detection
    errors: list[str]                  # Track any failures
    current_step: str                  # For Socket.IO progress
```

### 4.2 Graph Nodes

```
START
  │
  ▼
[scrape_url]  ← conditional: only if URL provided
  │
  ▼
[extract_claims]  ← GPT-5 nano, Chain-of-Thought
  │
  ▼
[search_evidence]  ← Tavily API, parallel search per claim
  │
  ▼
[verify_claims]  ← GPT-5 mini, self-reflection prompting
  │
  ▼
[resolve_conflicts]  ← handles contradictory evidence
  │
  ▼
[detect_ai_text]  ← Bonus: AI text detection
  │
  ▼
[detect_ai_media]  ← Bonus: AI media detection (if URL with images)
  │
  ▼
[assemble_report]  ← final structured report
  │
  ▼
END
```

### 4.3 Model Allocation Strategy

| Node | Model | Rationale |
|---|---|---|
| `extract_claims` | GPT-5 nano | Fast, cheap — claim decomposition is straightforward |
| `search_evidence` | N/A (Tavily API) | No LLM needed, pure search |
| `verify_claims` | GPT-5 mini | Needs strong reasoning for verdict + self-reflection |
| `resolve_conflicts` | GPT-5 mini | Complex reasoning over contradictory sources |
| `detect_ai_text` | GPT-5 nano | Classification task, doesn't need heavy reasoning |
| `assemble_report` | GPT-5 nano | Mostly formatting/summarization |

### 4.4 Key Prompt Techniques

#### Claim Extraction (Chain-of-Thought)
```
You are a fact-checking analyst. Break down the following text into atomic,
verifiable claims. For each claim:
1. Think step-by-step about what factual assertions are being made
2. Separate opinion from fact
3. Ensure each claim is self-contained (no pronouns referencing other claims)
4. Tag each claim with a category: [STATISTICAL, HISTORICAL, SCIENTIFIC, CURRENT_EVENT, QUOTE, OTHER]

Output JSON array of claims with fields: id, text, category, context
```

#### Verification (Self-Reflection)
```
You are a rigorous fact-checker. Given a claim and retrieved evidence:

STEP 1 — Initial Assessment: Based on the evidence, what is your verdict?
STEP 2 — Self-Reflection: Challenge your own reasoning. Could the evidence
          be misinterpreted? Is the source reliable? Is the claim time-sensitive?
STEP 3 — Final Verdict: Provide your final classification.

Verdicts: TRUE | FALSE | PARTIALLY_TRUE | UNVERIFIABLE
Also provide: confidence_score (0-100), reasoning, cited_sources[]
```

---

## 5. Backend Details

### 5.1 FastAPI + Socket.IO Integration

```python
# main.py — key structure
from fastapi import FastAPI
import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
socket_app = socketio.ASGIApp(sio, other_app=app)

# Each pipeline node emits progress:
async def emit_progress(session_id: str, step: str, data: dict):
    await sio.emit("pipeline_progress", {
        "step": step,        # "extracting" | "searching" | "verifying" | ...
        "data": data,        # partial results
        "timestamp": now()
    }, room=session_id)
```

### 5.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verify` | Submit text/URL for verification, returns `session_id` |
| `GET` | `/api/report/{session_id}` | Fetch completed report |
| `GET` | `/api/history` | List past verification reports |
| `GET` | `/api/health` | Health check |
| `WS` | `/socket.io/` | **Socket.IO** — real-time pipeline progress events |

### 5.3 URL Scraping (BeautifulSoup)

```python
# services/scraper.py
import requests
from bs4 import BeautifulSoup

async def scrape_url(url: str) -> ScrapedContent:
    response = requests.get(url, timeout=10, headers={"User-Agent": "..."})
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Remove script, style, nav, footer elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    
    text = soup.get_text(separator="\n", strip=True)
    images = [img["src"] for img in soup.find_all("img", src=True)]
    
    return ScrapedContent(text=text, images=images, title=soup.title.string)
```

### 5.4 Tavily Integration

```python
# agents/nodes/searcher.py
from langchain_community.tools.tavily_search import TavilySearchResults

tavily_tool = TavilySearchResults(
    max_results=5,
    search_depth="advanced",     # deeper search for better evidence
    include_raw_content=True,    # get full page content
)

# For each claim, generate optimized search queries
# then retrieve and rank evidence by relevance
```

### 5.5 Supabase Storage

We'll use Supabase to:
- **Store verification reports** — so users can revisit and share past results
- **Cache claim→evidence mappings** — avoid redundant Tavily calls for repeated claims
- **Track analytics** — number of verifications, common verdicts, etc.

Tables:
```sql
-- Verification sessions
CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_text TEXT,
    input_url TEXT,
    status TEXT DEFAULT 'processing',  -- processing | completed | failed
    report JSONB,
    ai_text_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual claims (for caching)
CREATE TABLE claims_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_text TEXT,
    claim_hash TEXT UNIQUE,            -- for dedup
    verdict TEXT,
    confidence FLOAT,
    evidence JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ             -- cache TTL for time-sensitive claims
);
```

---

## 6. Frontend Details

### 6.1 Tech Setup

- **Vite + React** (fast dev, optimized builds)
- **Tailwind CSS** or **CSS Modules** for styling (team preference)
- **Framer Motion** for animations
- **socket.io-client** for real-time updates
- **Lucide React** for icons

### 6.2 Core Screens

#### Screen 1: Input Page (Hero)
- Big centered input area — textarea for text, or URL field
- Toggle between "Paste Text" and "Enter URL" modes
- Beautiful gradient background, modern glassmorphism card
- "Verify" button with loading state
- Recent verification history sidebar

#### Screen 2: Live Pipeline View (appears after submit)
- **Step-by-step progress** — each stage animates in as it completes:
  1. 📄 **Parsing** — "Scraping URL..." / "Processing text..."
  2. 🔍 **Extracting Claims** — claims appear one by one with slide-in animation
  3. 🌐 **Searching Evidence** — search queries + sources stream in per claim
  4. ✅ **Verifying** — verdicts appear with color-coded badges
  5. 📊 **Generating Report** — final assembly
- This is the **"wow factor"** — judges will see the AI thinking in real time

#### Screen 3: Accuracy Report
- **Summary Header**: Overall accuracy score (% true), total claims, pie chart
- **AI Detection Badges**: "Likely AI-generated (87%)" or "Likely Human-Written (94%)"
- **Claim Cards**: Each claim in an expandable card showing:
  - Original text highlighted in context
  - Verdict badge: ✅ True / ❌ False / ⚠️ Partially True / ❓ Unverifiable
  - Confidence score bar
  - Expandable evidence panel with cited sources
  - Chain-of-thought reasoning (collapsible)
- **Source Map**: Visual mapping from original text → claims → sources
- **Export**: Download as PDF or share link

### 6.3 Socket.IO Client Hook

```javascript
// hooks/useSocket.js
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export function useVerificationStream(sessionId) {
    const [steps, setSteps] = useState([]);
    const [report, setReport] = useState(null);
    
    useEffect(() => {
        const socket = io(BACKEND_URL);
        socket.emit("join_session", sessionId);
        
        socket.on("pipeline_progress", (data) => {
            setSteps(prev => [...prev, data]);
        });
        
        socket.on("pipeline_complete", (data) => {
            setReport(data.report);
        });
        
        return () => socket.disconnect();
    }, [sessionId]);
    
    return { steps, report };
}
```

---

## 7. Bonus Feature: AI-Generated Text Detection (+10 pts)

### Approach
Use GPT-5 nano to analyze writing patterns and calculate an AI-generation probability:

```python
# services/ai_text_detector.py
async def detect_ai_text(text: str) -> AITextResult:
    """
    Multi-signal approach:
    1. LLM-based analysis — prompt GPT-5 to analyze writing patterns
       (perplexity patterns, vocabulary diversity, sentence structure uniformity)
    2. Statistical features — burstiness, sentence length variance,
       vocabulary richness (type-token ratio)
    3. Combine signals into a weighted probability score
    """
```

### Output
```json
{
    "ai_probability": 0.87,
    "confidence": "HIGH",
    "signals": [
        {"name": "Low perplexity variation", "weight": 0.3},
        {"name": "Uniform sentence structure", "weight": 0.25},
        {"name": "Limited vocabulary burstiness", "weight": 0.2}
    ],
    "verdict": "Likely AI-Generated"
}
```

---

## 8. Bonus Feature: AI-Generated Media Detection (+20 pts)

### Approach
When a URL is provided, extract images and analyze them for AI generation artifacts:

```python
# services/ai_media_detector.py
async def detect_ai_media(images: list[str]) -> list[MediaDetectionResult]:
    """
    For each image:
    1. Use GPT-5 mini's vision capability to analyze for:
       - Anatomical inconsistencies (hands, fingers, teeth)
       - Texture artifacts (skin smoothness, repeating patterns)
       - Background inconsistencies (warped lines, impossible geometry)
       - Lighting anomalies
       - Text/watermark artifacts common in AI images
    2. Return per-image verdict with reasoning
    """
```

### Output
```json
{
    "image_url": "https://...",
    "ai_probability": 0.72,
    "artifacts_detected": [
        "Irregular finger count in background figure",
        "Suspiciously uniform skin texture",
        "Text artifacts visible in signage"
    ],
    "verdict": "Possibly AI-Generated"
}
```

---

## 9. Error Handling & Resilience

Critical for the **Approach & Innovation (30%)** score:

| Failure | Recovery Strategy |
|---|---|
| Tavily search fails | Retry with reformulated query, then mark claim as "Unverifiable — search failed" |
| URL scraping fails | Return user-friendly error, suggest pasting text instead |
| Rate limit hit | Exponential backoff with jitter, queue remaining claims |
| LLM returns invalid JSON | Retry with stricter prompt, fallback to regex parsing |
| Conflicting evidence | Dedicated `resolve_conflicts` node weighs source authority & recency |
| Temporal claims | Tag and add "as of [date]" context to search queries |

---

## 10. Deployment (AWS EC2)

```
EC2 Instance (t3.medium or higher recommended)
├── Docker Compose
│   ├── backend   (FastAPI + Socket.IO)  → port 8000
│   ├── frontend  (Nginx serving React build) → port 80
│   └── (Supabase is hosted externally)
├── Nginx reverse proxy
│   ├── /           → frontend
│   ├── /api/       → backend
│   └── /socket.io/ → backend (WebSocket upgrade)
```

### docker-compose.yml
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 11. Environment Variables

```env
# .env.example
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

## 12. Implementation Phases

### Phase 1 — Foundation (Start Here)
- [ ] Initialize Vite + React frontend
- [ ] Initialize FastAPI backend
- [ ] Set up Socket.IO on both ends
- [ ] Set up Supabase tables
- [ ] Basic URL scraper with BeautifulSoup
- [ ] End-to-end "hello world": input → backend → socket event → frontend

### Phase 2 — Core Pipeline
- [ ] Define LangGraph state schema
- [ ] Build `extract_claims` node with CoT prompting
- [ ] Build `search_evidence` node with Tavily
- [ ] Build `verify_claims` node with self-reflection
- [ ] Build `resolve_conflicts` node
- [ ] Build `assemble_report` node
- [ ] Wire up full LangGraph graph with conditional edges
- [ ] Stream each node's output via Socket.IO

### Phase 3 — Frontend Polish
- [ ] Design and build Input Page (hero section)
- [ ] Build Live Pipeline Viewer with animations
- [ ] Build Accuracy Report page with interactive claim cards
- [ ] Build Evidence Panel (expandable sources with citations)
- [ ] Add overall accuracy summary (pie chart, stats)
- [ ] Add verification history page

### Phase 4 — Bonus Features
- [ ] AI-generated text detection service
- [ ] AI-generated media detection service (vision API)
- [ ] Integrate detection results into the report UI
- [ ] Add AI Detection badges to report

### Phase 5 — Production & Demo
- [ ] Dockerize both services
- [ ] Deploy to AWS EC2
- [ ] Test with 3+ diverse URLs (as required by problem statement)
- [ ] Prepare 10-minute demo flow
- [ ] Write README with setup instructions

---

## 13. Key Dependencies

### Backend (`requirements.txt`)
```
fastapi
uvicorn[standard]
python-socketio
langchain
langchain-openai
langgraph
tavily-python
beautifulsoup4
requests
supabase
pydantic
python-dotenv
httpx
```

### Frontend (`package.json`)
```
react
react-dom
socket.io-client
framer-motion
lucide-react
axios
recharts            # for pie charts / visualizations
react-router-dom
```

---

## 14. Demo Strategy (10-minute Presentation)

> **Goal**: Show 3 distinct URLs/texts with varying factual accuracy.

| Demo # | Input | Expected Outcome | Highlights |
|---|---|---|---|
| 1 | A mostly-accurate news article | High accuracy score, 1-2 false claims caught | Show pipeline streaming, evidence mapping |
| 2 | An article with known misinformation | Low accuracy, multiple FALSE verdicts | Show conflict resolution, detailed reasoning |
| 3 | AI-generated text with factual errors | FALSE verdicts + "AI-Generated" badge | Showcase both bonus features |

**Presentation Flow:**
1. (1 min) Problem & motivation
2. (2 min) Architecture overview & tech choices
3. (5 min) Live demo of all 3 scenarios
4. (2 min) Innovation highlights: conflict resolution, temporal awareness, bonus features

---

> **Let's build something the judges can't ignore. 🚀**
