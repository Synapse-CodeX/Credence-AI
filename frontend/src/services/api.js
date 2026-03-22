// src/services/api.js — Powered by Google Gemini (free tier)
// Strategy: ONE single API call for the entire analysis to avoid rate limits
// gemini-1.5-flash-8b: 15 RPM, 1M TPD — highest free limits available

const GEMINI_MODEL = "gemini-2.5-flash";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

function getApiKey() {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  if (!key) throw new Error("Missing REACT_APP_GEMINI_API_KEY in .env");
  return key;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callGemini(systemPrompt, userContent, maxTokens = 2048) {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
      }),
    });

    if (response.status === 429) {
      if (attempt === 3) throw new Error("Rate limit reached — please wait 60 seconds and try again.");
      const wait = [8000, 15000, 30000][attempt];
      console.log(`429 — waiting ${wait / 1000}s (attempt ${attempt + 1})`);
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
  const arr = cleaned.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  const obj = cleaned.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEGA CALL: Extract + Verify + AI Detection + Bias — ALL IN ONE API CALL
// This is the key to avoiding rate limits on free tier
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeAll(text) {
  const trimmed = text.trim().split(/\s+/).slice(0, 350).join(" ");

  const system = `You are a comprehensive text analysis engine. Given input text, perform ALL of the following in one response:

TASK 1 — Extract exactly 3 verifiable factual claims and verify each one.
TASK 2 — Detect if the text is AI-generated or human-written.
TASK 3 — Analyze political/emotional bias.

Return ONLY a single valid JSON object. No markdown, no explanation, no extra text.

Schema:
{
  "claims": [
    {
      "id": 1,
      "claim": "factual statement",
      "context": "short quote from source text",
      "verdict": "TRUE" | "FALSE" | "PARTIALLY TRUE" | "UNVERIFIABLE",
      "confidence": 0-100,
      "explanation": "2 sentence reasoning",
      "sources": ["source 1", "source 2"],
      "searchQuery": "search query",
      "conflicting": false,
      "timeSensitive": false,
      "difficulty": "EASY" | "MEDIUM" | "HARD"
    }
  ],
  "aiDetection": {
    "aiScore": 0-100,
    "humanScore": 0-100,
    "verdict": "LIKELY AI" | "LIKELY HUMAN" | "UNCERTAIN",
    "signals": ["signal1", "signal2", "signal3"]
  },
  "bias": {
    "overallBias": "LEFT" | "CENTER-LEFT" | "CENTER" | "CENTER-RIGHT" | "RIGHT" | "UNKNOWN",
    "biasScore": -100 to 100,
    "emotionalTone": "NEUTRAL" | "SENSATIONALIST" | "ALARMIST" | "PROMOTIONAL" | "CRITICAL",
    "objectivityScore": 0-100,
    "biasedPhrases": ["phrase1", "phrase2"],
    "summary": "1 sentence summary"
  }
}`;

  const raw = await callGemini(system, `Analyze this text:\n\n${trimmed}`, 3000);
  const parsed = parseJSON(raw);

  if (parsed?.claims && parsed?.aiDetection && parsed?.bias) return parsed;

  // Fallback if parsing fails
  return {
    claims: [{
      id: 1, claim: "Could not extract claims.", context: "",
      verdict: "UNVERIFIABLE", confidence: 0,
      explanation: "Analysis failed. Please try with shorter text.",
      sources: [], searchQuery: "", conflicting: false,
      timeSensitive: false, difficulty: "EASY",
    }],
    aiDetection: { aiScore: 50, humanScore: 50, verdict: "UNCERTAIN", signals: ["Analysis failed"] },
    bias: { overallBias: "UNKNOWN", biasScore: 0, emotionalTone: "NEUTRAL", objectivityScore: 50, biasedPhrases: [], summary: "Could not analyze bias." },
  };
}

// ─── AI Detection only (for AI Detection mode) ───────────────────────────────
export async function analyzeAIOnly(text) {
  const trimmed = text.trim().split(/\s+/).slice(0, 350).join(" ");

  const system = `Analyze the given text for AI vs human authorship AND political/emotional bias.
Return ONLY valid JSON, no markdown:
{
  "aiDetection": {
    "aiScore": 0-100,
    "humanScore": 0-100,
    "verdict": "LIKELY AI" | "LIKELY HUMAN" | "UNCERTAIN",
    "signals": ["signal1", "signal2", "signal3"]
  },
  "bias": {
    "overallBias": "LEFT" | "CENTER-LEFT" | "CENTER" | "CENTER-RIGHT" | "RIGHT" | "UNKNOWN",
    "biasScore": -100 to 100,
    "emotionalTone": "NEUTRAL" | "SENSATIONALIST" | "ALARMIST" | "PROMOTIONAL" | "CRITICAL",
    "objectivityScore": 0-100,
    "biasedPhrases": ["phrase1"],
    "summary": "1 sentence summary"
  }
}`;

  const raw = await callGemini(system, `Analyze:\n\n${trimmed}`, 1024);
  const parsed = parseJSON(raw);
  if (parsed?.aiDetection) return parsed;
  return {
    aiDetection: { aiScore: 50, humanScore: 50, verdict: "UNCERTAIN", signals: ["Analysis inconclusive"] },
    bias: { overallBias: "UNKNOWN", biasScore: 0, emotionalTone: "NEUTRAL", objectivityScore: 50, biasedPhrases: [], summary: "" },
  };
}

// ─── URL Fetch (via backend proxy) ───────────────────────────────────────────
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