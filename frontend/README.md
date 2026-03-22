# CredenceAI — AI Fact-Checking Engine

A sleek, neon-themed React web app that uses the Claude AI API to automatically extract claims from text, verify them against real-world knowledge, and generate a detailed accuracy report.

## Features

- **Claim Extraction** — Decomposes input text into discrete, verifiable facts
- **Verification Engine** — Verifies each claim with confidence scores and reasoning
- **AI Content Detection** — Estimates whether the text is AI-generated or human-written
- **Live Pipeline View** — Real-time progress indicators for each stage
- **Interactive Report** — Click to expand each claim for full analysis, sources, and search queries
- **Neon Dark UI** — Cyberpunk-inspired design with glowing effects

## Tech Stack

- **Frontend**: React 18
- **API**: Anthropic Claude (claude-sonnet-4-20250514)
- **Fonts**: Syne + Space Mono (Google Fonts)
- **Styling**: Pure CSS-in-JS with CSS variables

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your Anthropic API key

Open `src/services/api.js`. The API key is handled by the Anthropic proxy — no key needed for Claude.ai artifact mode.

For standalone deployment, add your API key to the fetch headers:
```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_API_KEY_HERE",
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
}
```

### 3. Run locally
```bash
npm start
```

### 4. Build for production
```bash
npm run build
```

## Project Structure

```
src/
├── App.js                  # Main application state & orchestration
├── index.js                # React entry point
├── index.css               # Global styles, CSS variables, animations
├── components/
│   ├── Background.js       # Animated grid + neon orbs background
│   ├── Header.js           # Top nav with logo and status indicator
│   ├── InputPanel.js       # Text / URL input with mode tabs
│   ├── Pipeline.js         # Step-by-step pipeline progress display
│   ├── ClaimCard.js        # Individual claim with expandable results
│   ├── VerdictBadge.js     # TRUE / FALSE / PARTIAL / UNVERIFIABLE badge
│   └── SummaryReport.js    # Overall accuracy score + AI detection
└── services/
    └── api.js              # Anthropic API calls (extract, verify, detect)
```

## Pipeline Flow

1. **Claim Extraction** → Claude splits input into atomic verifiable facts
2. **Evidence Retrieval** → Claude formulates search queries per claim
3. **Verification** → Each claim is cross-referenced and labeled
4. **Report Generation** → AI detection + overall accuracy score computed

## Verdicts

| Verdict | Meaning |
|---|---|
| ✓ TRUE | Claim is supported by evidence |
| ◐ PARTIALLY TRUE | Claim contains some accurate and some inaccurate elements |
| ✗ FALSE | Claim contradicts known evidence |
| ? UNVERIFIABLE | Insufficient evidence to determine truth |

## Bonus Features Implemented

- **AI Content Detection** — Probability score for AI vs human authorship with signal analysis

## Notes

- URL fetching requires a backend proxy (e.g. FastAPI/Express) to avoid CORS restrictions. Currently, paste text directly.
- For production, add rate limit handling and retry logic in `api.js`.
