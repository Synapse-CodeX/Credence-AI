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
                // The backend sends the report object directly in the 'data' field
                onComplete(parsed.data);
              } else if (parsed.step === "error") {
                onError(parsed.data.error || "Unknown pipeline error");
              } else {
                // Pass the whole step info to onProgress as App.js expects it
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

  // Map backend AITextResult to what the frontend expects
  return {
    aiDetection: {
      aiScore: Math.round(data.ai_probability * 100),
      humanScore: Math.round((1 - data.ai_probability) * 100),
      verdict: data.verdict === "AI" ? "LIKELY AI" : data.verdict === "Human" ? "LIKELY HUMAN" : "MIXED",
      signals: data.signals.map(s => JSON.stringify(s)), // Optionally format signals nicer
    },
    bias: null // Backend doesn't currently do bias in this endpoint
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
