// Analysis History — stored in localStorage per user

const KEY_PREFIX = 'veritai_history_';

function getKey(userId) {
  return `${KEY_PREFIX}${userId || 'guest'}`;
}

export function saveAnalysis(userId, entry) {
  try {
    const key = getKey(userId);
    const existing = getHistory(userId);
    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      ...entry,
    };
    const updated = [newEntry, ...existing].slice(0, 20); // keep last 20
    localStorage.setItem(key, JSON.stringify(updated));
    return newEntry;
  } catch { return null; }
}

export function getHistory(userId) {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function deleteAnalysis(userId, id) {
  try {
    const updated = getHistory(userId).filter(e => e.id !== id);
    localStorage.setItem(getKey(userId), JSON.stringify(updated));
  } catch {}
}

export function clearHistory(userId) {
  try { localStorage.removeItem(getKey(userId)); } catch {}
}