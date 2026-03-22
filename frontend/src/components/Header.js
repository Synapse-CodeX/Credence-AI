import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import UserMenu from './UserMenu';

const TICKER = [
  'CLAIM EXTRACTION ENGINE v2.1','EVIDENCE RETRIEVAL ACTIVE','REAL-TIME FACT VERIFICATION',
  'MULTI-SOURCE CROSS-REFERENCE','CONFIDENCE SCORING ENABLED','AI CONTENT DETECTION ONLINE',
  'CITATION ENGINE READY','PIPELINE STATUS: NOMINAL',
];

export default function Header() {
  const [time, setTime] = useState(new Date());
  const { isSignedIn } = useAuth();
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const tick = [...TICKER, ...TICKER].map(t => `  ◆  ${t}`).join('');

  return (
    <header style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid var(--line2)', background: 'rgba(6,10,15,0.95)', backdropFilter: 'blur(20px)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px', borderBottom: '1px solid var(--line)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '1px solid var(--a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 12px var(--a1-glow)' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--a1)', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', animation: 'pulse 2s ease infinite' }} />
            {[['-2px', '-2px'], ['auto', '-2px'], ['-2px', 'auto'], ['auto', 'auto']].map(([t, r], i) => (
              <div key={i} style={{ position: 'absolute', width: '4px', height: '4px', top: t === 'auto' ? 'auto' : t, bottom: t === 'auto' ? '-2px' : 'auto', left: r === 'auto' ? 'auto' : r, right: r === 'auto' ? '-2px' : 'auto', background: 'var(--a1)' }} />
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '22px', letterSpacing: '3px', color: 'var(--a1)', lineHeight: 1 }}>VERITAI</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginTop: '1px' }}>FACT VERIFICATION ENGINE</div>
          </div>
        </div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dim)' }}>
            <span style={{ color: 'var(--green)', animation: 'pulse 1.5s ease infinite' }}>●</span>
            <span>SYSTEM ONLINE</span>
          </div>
          <div style={{ padding: '4px 12px', border: '1px solid var(--line2)', color: 'var(--muted)', letterSpacing: '1px' }}>
            {time.toLocaleTimeString('en-US', { hour12: false })} UTC
          </div>
          <div style={{ padding: '4px 12px', border: '1px solid var(--a1)', color: 'var(--a1)', letterSpacing: '1px', boxShadow: '0 0 8px var(--a1-dim)' }}>
            GEMINI 2.0
          </div>
          {/* User menu — only when signed in */}
          {isSignedIn && <UserMenu />}
        </div>
      </div>

      {/* Ticker */}
      <div style={{ height: '26px', overflow: 'hidden', background: 'var(--bg1)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '1px', animation: 'ticker 40s linear infinite' }}>
          {tick}
        </div>
      </div>
    </header>
  );
}