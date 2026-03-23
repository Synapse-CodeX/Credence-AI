// src/services/api.js

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// ─── Factcheck verification pipeline (SSE Stream) ─────────────────────────
export async function startVerification(reqPayload, onProgress, onComplete, onError, signal) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqPayload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      onError(`Verification failed: ${response.status} - ${errorText}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop(); // Keep the last incomplete chunk

      for (const lineGroup of lines) {
        const linesList = lineGroup.split("\n");
        for (const line of linesList) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.step === "pipeline_complete") {
                // Map the backend Report so it merges claims & verdicts for the UI
                const report = parsed.data;
                const mergedClaims = (report.claims || []).map(c => {
                  const v = (report.verdicts || []).find(x => x.claim_id === c.id) || {};
                  return {
                    id: c.id,
                    claim: c.text,
                    context: c.context || "",
                    verdict: v.verdict || "UNVERIFIABLE",
                    confidence: v.confidence_score !== undefined ? v.confidence_score : 0,
                    explanation: v.reasoning || "",
                    sources: v.cited_sources || [],
                    searchQuery: v.search_query || "",
                    conflicting: v.conflicting || false,
                    timeSensitive: v.time_sensitive || false,
                    difficulty: v.difficulty || "MEDIUM",
                    tavilyAnswer: v.tavily_answer || ""
                  };
                });

                onComplete({ ...report, claims: mergedClaims, verified_claims: mergedClaims });
              } else if (parsed.step === "error") {
                onError(parsed.data.error || "Unknown pipeline error");
              } else {
                // If it's an intermediate step sending verdicts, map it to verified_claims
                if (parsed.data && parsed.data.verdicts) {
                  parsed.data.verified_claims = parsed.data.verdicts;
                }
                onProgress(parsed);
              }
            } catch (e) {
              console.error("Failed to parse SSE data", dataStr, e);
            }
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Verification cancelled by user.');
    } else {
      onError(err.message || "Network error while connecting to verify API.");
    }
  }
}

// ─── AI Detection only ───────────────────────────────────────────────────────
export async function checkAIText(text) {
  const response = await fetch(`${BACKEND_URL}/api/detect-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.detail || `AI Detection failed: ${response.status}`);
  }
  const data = await response.json();

  return {
    aiDetection: {
      aiScore: Math.round(data.ai_probability * 100),
      humanScore: Math.round((1 - data.ai_probability) * 100),
      verdict: data.verdict === "AI" ? "LIKELY AI" : data.verdict === "Human" ? "LIKELY HUMAN" : "MIXED",
      signals: data.signals || [],
    },
    bias: null
  };
}

export async function checkAIImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/detect-media/image-upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.detail || `AI Image Detection failed: ${response.status}`);
  }
  const data = await response.json();

  return {
    aiDetection: {
      aiScore: Math.round(data.ai_generated_score * 100),
      humanScore: Math.round((1 - data.ai_generated_score) * 100),
      verdict: data.verdict === 'Likely AI-Generated' ? 'LIKELY AI' :
               data.verdict === 'Likely Real' ? 'LIKELY HUMAN' : 'MIXED',
      signals: ['Visual artifacts checked', 'GenAI signature analysis via SightEngine'],
    },
    bias: null
  };
}

// ─── Legacy Wrapper for App.js ──────────────────────────────────────────────
export function analyzeAll(content) {
  return new Promise((resolve, reject) => {
    startVerification(
      { text: content },
      (progress) => { /* ignore SSE progress */ },
      (data) => {
        const report = data.report || data;

        const mappedClaims = (report.claims || []).map(c => {
          const v = (report.verdicts || []).find(x => x.claim_id === c.id) || {};
          return {
            id: c.id,
            claim: c.text,
            context: c.context || "",
            verdict: v.verdict || "UNVERIFIABLE",
            confidence: v.confidence_score || 0,
            explanation: v.reasoning || "",
            sources: v.cited_sources || [],
            searchQuery: "",
            conflicting: false,
            timeSensitive: false,
            difficulty: ""
          };
        });

        let aiDetection = null;
        if (report.ai_text_result) {
          const ai = report.ai_text_result;
          aiDetection = {
            aiScore: Math.round((ai.ai_probability || 0) * 100),
            humanScore: Math.round((1 - (ai.ai_probability || 0)) * 100),
            verdict: ai.verdict === "AI" ? "LIKELY AI" : ai.verdict === "Human" ? "LIKELY HUMAN" : "MIXED",
            signals: ai.signals || []
          };
        }

        resolve({
          claims: mappedClaims,
          aiDetection: aiDetection,
          bias: null
        });
      },
      (error) => reject(new Error(error)),
      null
    );
  });
}