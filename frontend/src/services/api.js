// src/services/api.js — Powered by Google Gemini (free tier)
// Only 2 API calls total. Uses gemini-2.0-flash-lite which has higher free limits.

const GEMINI_MODEL = "gemini-2.0-flash-lite"; // higher RPM on free tier
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

function getApiKey() {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  if (!key) throw new Error("Missing REACT_APP_GEMINI_API_KEY in .env");
  return key;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callGemini(systemPrompt, userContent) {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    // 30-second timeout per request to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error("Request timed out after 30s. Please try again.");
      throw err;
    }
    clearTimeout(timeout);

    if (response.status === 429) {
      if (attempt === 2) throw new Error("Rate limit reached — please wait a minute and try again.");
      const wait = [3000, 6000][attempt];
      console.log(`Rate limited, retrying in ${wait/1000}s...`);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

function parseJSON(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  return null;
}

// ─── COMBINED: Extract + Verify all claims in ONE call ───────────────────────

export async function extractAndVerifyAll(text) {
  // Trim input to reduce token usage — key to avoiding TPM limits
  const trimmed = text.trim().split(/\s+/).slice(0, 400).join(" ");

  const system = `You are a fact-checking engine. Analyze the input text and do two things:
1. Extract exactly 3 verifiable factual claims (no more, no less).
2. Verify each claim immediately.

Return ONLY a JSON array with exactly 3 objects. No markdown, no explanation, no extra text.
Each object must have ALL these fields:
{
  "id": 1,
  "claim": "the factual statement",
  "context": "short quote from source text",
  "verdict": "TRUE" or "FALSE" or "PARTIALLY TRUE" or "UNVERIFIABLE",
  "confidence": 75,
  "explanation": "2 sentence reasoning",
  "sources": ["source 1", "source 2"],
  "searchQuery": "search query to verify",
  "conflicting": false
}`;

  const raw = await callGemini(system, `Text to analyze:\n\n${trimmed}`);
  const parsed = parseJSON(raw);

  if (Array.isArray(parsed) && parsed.length > 0) return parsed;

  return [{
    id: 1, claim: "Could not extract claims from this text.", context: "",
    verdict: "UNVERIFIABLE", confidence: 0,
    explanation: "The model did not return a valid response.",
    sources: [], searchQuery: "", conflicting: false,
  }];
}

// ─── AI Detection ────────────────────────────────────────────────────────────

export async function detectAIContent(text) {
  const trimmed = text.trim().split(/\s+/).slice(0, 300).join(" ");

  const system = `Detect if text is AI-generated or human-written.
Return ONLY valid JSON, no markdown:
{ "aiScore": 0-100, "humanScore": 0-100, "verdict": "LIKELY AI" | "LIKELY HUMAN" | "UNCERTAIN", "signals": ["signal1","signal2","signal3"] }`;

  const raw = await callGemini(system, `Analyze:\n\n${trimmed}`);
  const parsed = parseJSON(raw);
  if (parsed?.verdict) return parsed;
  return { aiScore: 50, humanScore: 50, verdict: "UNCERTAIN", signals: ["Analysis inconclusive"] };
}

// ─── URL Fetch ───────────────────────────────────────────────────────────────

export async function fetchUrlText(url) {
  const response = await fetch(`${BACKEND_URL}/fetch-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch URL (${response.status})`);
  }
  return response.json();
}