import React from 'react';

const STEPS = [
  { id: 'extract', code: '01', label: 'CLAIM EXTRACTION',   sub: 'Decomposing text into atomic facts',     icon: '◈' },
  { id: 'search',  code: '02', label: 'EVIDENCE RETRIEVAL', sub: 'Formulating queries & fetching sources', icon: '◎' },
  { id: 'verify',  code: '03', label: 'VERIFICATION',       sub: 'Cross-referencing against evidence',     icon: '◉' },
  { id: 'report',  code: '04', label: 'REPORT GENERATION',  sub: 'Compiling accuracy report',              icon: '◆' },
];

export default function Pipeline({ currentStep, claimCount, verifiedCount, isDone, isAIDetect }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);

  // allDone: explicit prop OR naturally completed
  const allDone = isDone ||
    currentStep === 'report' ||
    (claimCount > 0 && verifiedCount >= claimCount && currentStep === 'verify');

  return (
    <div className="glass-card" style={{ overflow: 'hidden', animation: 'slideInLeft 0.4s ease 0.1s both' }}>
      {/* header */}
      <div style={{
        padding: '12px 18px', background: 'var(--bg2)',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ width: '3px', height: '16px', background: 'var(--cyan)', borderRadius: '2px' }} />
        <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2.5px', color: 'var(--cyan)' }}>
          PIPELINE
        </span>
        {allDone && (
          <span style={{
            marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '9px',
            padding: '2px 8px', background: 'var(--green-dim)',
            border: '1px solid rgba(0,232,135,0.3)', borderRadius: 'var(--radius)',
            color: 'var(--green)', letterSpacing: '1px',
          }}>COMPLETE</span>
        )}
        {/* Live indicator — shown when verifying with no fixed claim count */}
        {!allDone && currentStep === 'verify' && claimCount === 0 && (
          <span style={{
            marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '9px',
            padding: '2px 8px', background: 'rgba(255,69,96,0.08)',
            border: '1px solid rgba(255,69,96,0.3)', borderRadius: 'var(--radius)',
            color: 'var(--red)', letterSpacing: '1px',
            animation: 'pulse 1.2s ease infinite',
          }}>⚡ LIVE</span>
        )}
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {STEPS.map((step, i) => {
          const isSkippedStep = isAIDetect && (step.id === 'extract' || step.id === 'search');
          const done = !isSkippedStep && (allDone || (currentIdx > i));
          const active = !isSkippedStep && !allDone && i === currentIdx;

          return (
            <div key={step.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: active ? 'rgba(240,180,41,0.06)' : done ? 'rgba(0,232,135,0.04)' : isSkippedStep ? 'rgba(255,255,255,0.02)' : 'transparent',
                border: `1px solid ${active ? 'rgba(240,180,41,0.3)' : done ? 'rgba(0,232,135,0.15)' : 'var(--line)'}`,
                transition: 'all 0.3s ease',
                opacity: isSkippedStep ? 0.5 : 1,
              }}>
                {/* step number */}
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  color: done ? 'var(--green)' : active ? 'var(--a1)' : isSkippedStep ? 'var(--muted)' : 'var(--bg3)',
                  width: '20px', flexShrink: 0,
                }}>{step.code}</div>

                {/* icon / spinner */}
                <div style={{
                  width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, borderRadius: '50%',
                  background: done ? 'rgba(0,232,135,0.1)' : active ? 'rgba(240,180,41,0.1)' : 'transparent',
                }}>
                  {done ? (
                    <span style={{ color: 'var(--green)', fontSize: '13px' }}>✓</span>
                  ) : active ? (
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '2px solid var(--a1)', borderTopColor: 'transparent',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  ) : isSkippedStep ? (
                    <span style={{ color: 'var(--dim)', fontSize: '10px' }}>—</span>
                  ) : (
                    <span style={{ color: 'var(--dim)', fontSize: '12px', opacity: 0.5 }}>{step.icon}</span>
                  )}
                </div>

                {/* label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '1px',
                    color: done ? 'var(--green)' : active ? 'var(--a1)' : isSkippedStep ? 'var(--muted)' : 'var(--dim)',
                    fontWeight: active ? '500' : '400',
                    transition: 'color 0.3s',
                  }}>{step.label}</div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)',
                    marginTop: '3px', letterSpacing: '0.5px',
                  }}>
                    {active && step.id === 'verify'
                      ? claimCount > 0
                        ? `verifying claim ${Math.min(verifiedCount + 1, claimCount)} of ${claimCount}`
                        : `verifying... ${verifiedCount > 0 ? `(${verifiedCount} done)` : ''}`
                      : isSkippedStep ? 'Not applicable for AI detection' : step.sub}
                  </div>
                </div>

                {/* status badge */}
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1.2px', flexShrink: 0,
                  color: done ? 'var(--green)' : active ? 'var(--a1)' : isSkippedStep ? 'var(--dim)' : 'transparent',
                  animation: active ? 'pulse 1.2s ease infinite' : 'none',
                }}>
                  {done ? 'DONE' : active ? 'RUN' : isSkippedStep ? 'SKIP' : '—'}
                </div>
              </div>

              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: '2px', height: '6px', margin: '0 auto',
                  background: done ? 'var(--green)' : 'var(--line)',
                  transition: 'background 0.5s ease', borderRadius: '1px',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar — shown when claimCount is known */}
      {currentStep === 'verify' && claimCount > 0 && (
        <div style={{ padding: '4px 14px 14px' }}>
          <div style={{ height: '3px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round((verifiedCount / claimCount) * 100)}%`,
              background: 'linear-gradient(90deg, var(--a1), var(--cyan))',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px var(--a1-glow)',
              borderRadius: '2px',
            }} />
          </div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)',
            marginTop: '6px', letterSpacing: '1px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{verifiedCount}/{claimCount} VERIFIED</span>
            <span>{Math.round((verifiedCount / claimCount) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Live counter — shown when claimCount unknown (live voice mode) */}
      {currentStep === 'verify' && claimCount === 0 && verifiedCount > 0 && (
        <div style={{ padding: '4px 14px 14px' }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--red)',
            letterSpacing: '1px', animation: 'pulse 1.5s ease infinite',
          }}>
            ⚡ {verifiedCount} CLAIM{verifiedCount !== 1 ? 'S' : ''} VERIFIED SO FAR
          </div>
        </div>
      )}
    </div>
  );
}