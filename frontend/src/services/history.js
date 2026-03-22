// Analysis History — Fetching from Backend

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export async function getHistory(userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/history?limit=20&offset=0&user_id=${userId}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.items.map(item => ({
      id: item.session_id,
      timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      mode: 'factcheck', // Default until backend supports aiding distinguishing mode
      snippet: item.input_text.slice(0, 60) + (item.input_text.length > 60 ? '...' : ''),
      accuracyScore: item.overall_accuracy !== null ? item.overall_accuracy : undefined,
      claimCount: item.claim_count,
      status: item.status
    }));
  } catch (err) {
    console.error("Failed to fetch history:", err);
    return [];
  }
}

export async function saveAnalysis(userId, entry) {
  // The backend already handles persisting sessions via the execution pipeline.
  // There is no need for the frontend to save it explicitly anymore.
  return entry;
}

export function deleteAnalysis(userId, id) {
  console.log('Delete history currently not implemented in backend REST API');
}

export function clearHistory(userId) {
  console.log('Clear history currently not implemented in backend REST API');
}