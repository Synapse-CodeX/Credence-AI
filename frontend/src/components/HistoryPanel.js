import React, { useState } from 'react';
import { deleteAnalysis, clearHistory } from '../services/history';

const verdictColor = {
  'TRUE': 'var(--green)', 'FALSE': 'var(--red)',
  'PARTIALLY TRUE': 'var(--orange)', 'UNVERIFIABLE': 'var(--muted)'
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function HistoryPanel({ history = [], userId, onRestore, onHistoryChange }) {
  const [confirmClear, setConfirmClear] = useState(false);

  // Debug: log to verify it's receiving data
  console.log('[HistoryPanel] userId:', userId, '| entries:', history.length);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteAnalysis(userId, id);
    onHistoryChange();
  };

  const handleClear = () => {
    if (confirmClear) {
      clearHistory(userId);
      onHistoryChange();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div style={{
      border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)',
      background: 'var(--bg1)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', background: 'var(--bg2)',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '3px', height: '16px', background: 'var(--cyan)' }} />
          <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--cyan)' }}>HISTORY</span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)',
            padding: '1px 6px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)',
          }}>{history.length}</span>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} style={{
            fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px',
            color: confirmClear ? 'var(--red)' : 'var(--dim)',
            background: 'transparent',
            border: `1px solid ${confirmClear ? 'rgba(255,69,96,0.4)' : 'var(--line2)'}`,
            borderRadius: 'var(--radius)', padding: '2px 8px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>{confirmClear ? 'CONFIRM?' : 'CLEAR ALL'}</button>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div style={{
          padding: '28px 16px', textAlign: 'center',
          fontFamily: 'var(--mono)', fontSize: '10px',
          color: 'var(--dim)', letterSpacing: '1px',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', opacity: 0.3 }}>◈</div>
          NO ANALYSES YET
        </div>
      ) : (
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {history.map((entry, i) => (
            <div
              key={entry.id}
              onClick={() => onRestore(entry)}
              style={{
                padding: '10px 14px',
                borderBottom: i < history.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Mode icon */}
              <div style={{
                width: '26px', height: '26px', flexShrink: 0,
                borderRadius: 'var(--radius)', marginTop: '1px',
                background: entry.mode === 'factcheck' ? 'var(--a1-dim)' : 'var(--cyan-dim)',
                border: `1px solid ${entry.mode === 'factcheck' ? 'rgba(240,180,41,0.3)' : 'rgba(0,212,255,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px',
              }}>
                {entry.mode === 'factcheck' ? '⚖' : '◈'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Snippet */}
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.snippet || 'Analysis'}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' }}>
                    {timeAgo(entry.timestamp)}
                  </span>

                  {/* Accuracy score for factcheck */}
                  {entry.mode === 'factcheck' && entry.accuracyScore !== undefined && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: '9px',
                      color: entry.accuracyScore >= 75 ? 'var(--green)'
                        : entry.accuracyScore >= 40 ? 'var(--orange)' : 'var(--red)',
                    }}>
                      {entry.accuracyScore}% accurate
                    </span>
                  )}

                  {/* AI score for aidetect */}
                  {entry.mode === 'aidetect' && entry.aiScore !== undefined && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--red)' }}>
                      {entry.aiScore}% AI
                    </span>
                  )}

                  {/* Verdict dots */}
                  {entry.verdicts && (
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {Object.entries(entry.verdicts).map(([v, count]) =>
                        count > 0 ? (
                          <div key={v} title={`${count} ${v}`} style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: verdictColor[v] || 'var(--dim)',
                            boxShadow: `0 0 4px ${verdictColor[v] || 'var(--dim)'}`,
                          }} />
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={e => handleDelete(e, entry.id)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--dim)', fontSize: '11px',
                  cursor: 'pointer', padding: '2px 4px',
                  transition: 'color 0.1s', flexShrink: 0,
                  fontFamily: 'var(--mono)',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--red)'}
                onMouseLeave={e => e.target.style.color = 'var(--dim)'}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}