import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import UserMenu from './UserMenu';

const TICKER = [
  'CLAIM EXTRACTION ENGINE v2.1','EVIDENCE RETRIEVAL ACTIVE','REAL-TIME FACT VERIFICATION',
  'MULTI-SOURCE CROSS-REFERENCE','CONFIDENCE SCORING ENABLED','AI CONTENT DETECTION ONLINE',
  'CITATION ENGINE READY','PIPELINE STATUS: NOMINAL',
];

export default function Header({ onBackToLanding }) {
  const [time, setTime] = useState(new Date());
  const { isSignedIn } = useAuth();
  const [vw, setVw] = useState(window.innerWidth);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 900;
  const tick = [...TICKER, ...TICKER].map(t => `  ◆  ${t}`).join('');

  return (
    <header style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid var(--line2)', background: 'rgba(6,10,15,0.95)', backdropFilter: 'blur(20px)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : '0 24px',
        height: isMobile ? '50px' : '56px',
        borderBottom: '1px solid var(--line)',
      }}>
        {/* Left — back button + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
          <button
            onClick={onBackToLanding}
            title="Back to home"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: isMobile ? '4px 8px' : '5px 10px',
              background: 'transparent',
              border: '1px solid var(--line2)',
              borderRadius: 'var(--radius)',
              color: 'var(--dim)',
              fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.5px',
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--a1)';
              e.currentTarget.style.color = 'var(--a1)';
              e.currentTarget.style.boxShadow = '0 0 10px var(--a1-dim)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--line2)';
              e.currentTarget.style.color = 'var(--dim)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← {isMobile ? '' : 'HOME'}
          </button>

          {/* Logo */}
          <div style={{ width: isMobile ? '26px' : '32px', height: isMobile ? '26px' : '32px', border: '1px solid var(--a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 12px var(--a1-glow)', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '8px' : '10px', height: isMobile ? '8px' : '10px', background: 'var(--a1)', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', animation: 'pulse 2s ease infinite' }} />
            {[['-2px', '-2px'], ['auto', '-2px'], ['-2px', 'auto'], ['auto', 'auto']].map(([t, r], i) => (
              <div key={i} style={{ position: 'absolute', width: '3px', height: '3px', top: t === 'auto' ? 'auto' : t, bottom: t === 'auto' ? '-2px' : 'auto', left: r === 'auto' ? 'auto' : r, right: r === 'auto' ? '-2px' : 'auto', background: 'var(--a1)' }} />
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? '18px' : '22px', letterSpacing: '3px', color: 'var(--a1)', lineHeight: 1 }}>CredenceAI</div>
            {!isMobile && <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginTop: '1px' }}>FACT VERIFICATION ENGINE</div>}
          </div>
        </div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          {/* Status dot — always visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--dim)' }}>
            <span style={{ color: 'var(--green)', animation: 'pulse 1.5s ease infinite', fontSize: '8px' }}>●</span>
            {!isMobile && <span style={{ fontSize: '10px' }}>ONLINE</span>}
          </div>

          {/* Time — hide on mobile */}
          {!isMobile && (
            <div style={{ padding: '4px 10px', border: '1px solid var(--line2)', color: 'var(--muted)', letterSpacing: '1px', fontSize: '10px' }}>
              {time.toLocaleTimeString('en-US', { hour12: false })} UTC
            </div>
          )}

          {/* Model badge — always visible */}
          <div style={{
            padding: isMobile ? '3px 8px' : '4px 12px',
            border: '1px solid var(--a1)', color: 'var(--a1)',
            letterSpacing: '1px', fontSize: '10px',
            boxShadow: '0 0 8px var(--a1-dim)',
          }}>
            {isMobile ? 'G2.0' : 'GEMINI 2.0'}
          </div>

          {isSignedIn && <UserMenu />}
        </div>
      </div>

      {/* Ticker — thinner on mobile */}
      <div style={{ height: '22px', overflow: 'hidden', background: 'var(--bg1)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px', animation: 'ticker 40s linear infinite' }}>
          {tick}
        </div>
      </div>
    </header>
  );
}