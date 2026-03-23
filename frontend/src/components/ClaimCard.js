import React, { useState, useEffect } from 'react';
import VerdictBadge from './VerdictBadge';

function ConfBar({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '3px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px', boxShadow: `0 0 6px ${color}`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color, minWidth: '32px', textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

function Typewriter({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayed}<span style={{ animation: 'pulse 0.8s ease infinite', opacity: displayed.length < text.length ? 1 : 0 }}>▌</span></span>;
}

const verdictColor = {
  'TRUE': 'var(--green)', 'FALSE': 'var(--red)',
  'PARTIALLY TRUE': 'var(--orange)', 'UNVERIFIABLE': 'var(--muted)',
};

const difficultyConfig = {
  'EASY':   { color: 'var(--green)',  label: 'EASY'   },
  'MEDIUM': { color: 'var(--orange)', label: 'MEDIUM' },
  'HARD':   { color: 'var(--red)',    label: 'HARD'   },
};

// Render a source string — wraps in <a> if it looks like a URL
function SourceLink({ s }) {
  const isUrl = /^https?:\/\//.test(s);
  if (!isUrl) return <span>{s}</span>;
  return (
    <a
      href={s}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--cyan)',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(0,212,255,0.35)',
        textUnderlineOffset: '2px',
        transition: 'color 0.15s',
        wordBreak: 'break-all',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--cyan)'}
    >
      {s}
    </a>
  );
}

export default function ClaimCard({ claim, result, index, loading }) {
  const [open, setOpen] = useState(false);
  const color = result ? (verdictColor[result.verdict] || 'var(--muted)') : 'var(--line2)';

  return (
    <div style={{
      border: `1px solid ${result ? color + '55' : 'var(--line)'}`,
      borderLeft: `3px solid ${result ? color : 'var(--bg3)'}`,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg1)', overflow: 'hidden',
      transition: 'all 0.3s',
      animation: `fadeUp 0.35s ease ${index * 0.08}s both`,
    }}>
      {/* Claim row */}
      <div onClick={() => result && setOpen(!open)} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', cursor: result ? 'pointer' : 'default' }}>
        <div style={{ width: '26px', height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', background: 'var(--bg2)', marginTop: '1px' }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.65' }}>{claim.claim}</div>
          {claim.context && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', marginTop: '5px', fontStyle: 'italic' }}>
              — "{claim.context}"
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
            {result?.timeSensitive && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(255,184,48,0.1)', border: '1px solid rgba(255,184,48,0.3)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--orange)', letterSpacing: '1px' }}>
                ⏰ TIME-SENSITIVE
              </div>
            )}
            {result?.difficulty && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: `${difficultyConfig[result.difficulty]?.color}12`, border: `1px solid ${difficultyConfig[result.difficulty]?.color}30`, borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px', color: difficultyConfig[result.difficulty]?.color, letterSpacing: '1px' }}>
                ◆ {result.difficulty}
              </div>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loading && !result && (
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          )}
          {result && <VerdictBadge verdict={result.verdict} />}
          {result && <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>}
        </div>
      </div>

      {/* Expanded */}
      {result && open && (
        <div style={{ borderTop: '1px solid var(--line)', background: 'var(--bg0)', animation: 'fadeIn 0.2s ease both' }}>
          {/* confidence */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>CONFIDENCE SCORE</div>
            <ConfBar value={result.confidence} color={color} />
          </div>

          {/* explanation */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>ANALYSIS</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.7', padding: '10px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
              <Typewriter text={result.explanation} />
            </div>
            {result.conflicting && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--orange)', padding: '6px 10px', background: 'var(--orange-dim)', border: '1px solid rgba(255,140,66,0.25)', borderRadius: 'var(--radius)' }}>
                ⚡ CONFLICTING SOURCES — verdict based on majority evidence
              </div>
            )}
          </div>

          {/* sources — clickable if URL */}
          {result.sources?.length > 0 && (
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>
                CITED SOURCES ({result.sources.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {result.sources.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', padding: '6px 10px', background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 'var(--radius)', wordBreak: 'break-all', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'}>
                    <span style={{ color: 'var(--dim)', flexShrink: 0 }}>#{String(i + 1).padStart(2, '0')}</span>
                    <SourceLink s={s} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* search query */}
          {result.searchQuery && (
            <div style={{ padding: '10px 16px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>SEARCH QUERY → </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--a1)' }}>"{result.searchQuery}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}