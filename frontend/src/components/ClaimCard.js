import React, { useState, useEffect } from 'react';
import VerdictBadge from './VerdictBadge';

function ConfBar({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1, height: '4px', background: 'var(--bg3)',
        borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
          borderRadius: '3px', boxShadow: `0 0 8px ${color}`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: '12px', color,
        minWidth: '36px', textAlign: 'right', fontWeight: '500',
      }}>
        {value}%
      </span>
    </div>
  );
}

const verdictColor = {
  'TRUE': 'var(--green)', 'FALSE': 'var(--red)',
  'PARTIALLY TRUE': 'var(--orange)', 'UNVERIFIABLE': 'var(--muted)',
};

export default function ClaimCard({ claim, result, index, loading }) {
  const [open, setOpen] = useState(false);
  const color = result ? (verdictColor[result.verdict] || 'var(--muted)') : 'var(--line2)';

  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;

  return (
    <div
      className="glass-card"
      style={{
        borderLeft: `3px solid ${result ? color : 'var(--bg3)'}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        animation: `fadeUp 0.35s ease ${index * 0.08}s both`,
      }}
    >
      {/* claim row */}
      <div
        onClick={() => result && setOpen(!open)}
        role={result ? 'button' : undefined}
        tabIndex={result ? 0 : undefined}
        aria-expanded={result ? open : undefined}
        onKeyDown={e => result && e.key === 'Enter' && setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: isMobile ? '14px 14px' : '16px 18px',
          cursor: result ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { if (result) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={e => { if (result) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* index */}
        <div style={{
          width: '26px', height: '26px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--line2)', borderRadius: 'var(--radius)',
          fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
          background: 'var(--bg2)', marginTop: '2px',
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '13px' : '13.5px', color: 'var(--text)',
            lineHeight: '1.7', fontWeight: '400',
          }}>
            {claim.claim}
          </div>
          {claim.context && !isMobile && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
              marginTop: '6px', letterSpacing: '0.3px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ color: 'var(--a1)', fontSize: '9px' }}>◈</span>
              "{claim.context}"
            </div>
          )}
        </div>

        {/* right side */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && !result && (
            <div className="shimmer" style={{ width: isMobile ? '60px' : '80px', height: '24px', borderRadius: 'var(--radius)' }} />
          )}
          {result && <VerdictBadge verdict={result.verdict} />}
          {result && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--dim)',
              transition: 'transform 0.25s ease',
              transform: open ? 'rotate(180deg)' : 'none',
              width: '20px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              background: open ? 'var(--bg3)' : 'transparent',
            }}>▾</div>
          )}
        </div>
      </div>

      {/* expanded detail */}
      {result && open && (
        <div style={{
          borderTop: '1px solid var(--line)',
          background: 'rgba(6,10,15,0.6)',
          animation: 'fadeIn 0.25s ease both',
        }}>
          {/* confidence */}
          <div style={{ padding: isMobile ? '12px 14px' : '16px 18px', borderBottom: '1px solid var(--line)' }}>
            <div className="mono-label" style={{ marginBottom: '10px' }}>CONFIDENCE SCORE</div>
            <ConfBar value={result.confidence} color={color} />
          </div>

          {/* analysis */}
          <div style={{ padding: isMobile ? '12px 14px' : '16px 18px', borderBottom: '1px solid var(--line)' }}>
            <div className="mono-label" style={{ marginBottom: '10px' }}>ANALYSIS</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: isMobile ? '11px' : '12px', color: 'var(--muted)',
              lineHeight: '1.8', padding: '12px 14px',
              background: 'var(--bg1)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              borderLeft: '2px solid ' + color,
            }}>
              {result.explanation}
            </div>
            {result.conflicting && (
              <div style={{
                marginTop: '10px',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--orange)',
                padding: '8px 12px',
                background: 'var(--orange-dim)', border: '1px solid rgba(255,140,66,0.25)',
                borderRadius: 'var(--radius)',
              }}>
                ⚡ CONFLICTING SOURCES — verdict based on majority evidence
              </div>
            )}
          </div>

          {/* sources */}
          {result.sources?.length > 0 && (
            <div style={{ padding: isMobile ? '12px 14px' : '16px 18px', borderBottom: '1px solid var(--line)' }}>
              <div className="mono-label" style={{ marginBottom: '10px' }}>
                CITED SOURCES ({result.sources.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.sources.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)',
                    padding: '8px 12px',
                    background: 'var(--cyan-dim)',
                    border: '1px solid rgba(0,212,255,0.12)',
                    borderRadius: 'var(--radius)',
                    lineHeight: '1.5',
                    wordBreak: 'break-all',
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,212,255,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,212,255,0.12)'}
                  >
                    <span style={{ color: 'var(--dim)', flexShrink: 0, fontWeight: '500' }}>#{String(i + 1).padStart(2, '0')}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* search query */}
          {result.searchQuery && (
            <div style={{
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            }}>
              <span className="mono-label">SEARCH →</span>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--a1)',
                padding: '3px 10px', background: 'var(--a1-dim)',
                border: '1px solid rgba(240,180,41,0.2)',
                borderRadius: 'var(--radius)',
                wordBreak: 'break-word',
              }}>
                "{result.searchQuery}"
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}