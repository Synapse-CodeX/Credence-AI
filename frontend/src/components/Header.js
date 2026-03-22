import React, { useEffect, useState } from 'react';

const TICKER = [
  'CLAIM EXTRACTION ENGINE v2.1','EVIDENCE RETRIEVAL ACTIVE','REAL-TIME FACT VERIFICATION',
  'MULTI-SOURCE CROSS-REFERENCE','CONFIDENCE SCORING ENABLED','AI CONTENT DETECTION ONLINE',
  'CITATION ENGINE READY','PIPELINE STATUS: NOMINAL','GEMINI 2.0 FLASH — OPERATIONAL',
];

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tick = [...TICKER, ...TICKER].map(t => `  ◆  ${t}`).join('');

  return (
    <header style={{
      position:'sticky', top:0, zIndex:100,
      borderBottom:'1px solid var(--line2)',
      background:'rgba(6,10,15,0.88)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
    }}>
      {/* ── top bar ── */}
      <div className="header-content" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 32px', height:'56px',
        borderBottom:'1px solid var(--line)',
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'14px',cursor:'default'}}>
          <div style={{
            width:'34px', height:'34px',
            border:'1.5px solid var(--a1)',
            borderRadius:'4px',
            display:'flex', alignItems:'center', justifyContent:'center',
            position:'relative',
            boxShadow:'0 0 16px var(--a1-glow)',
            transition:'box-shadow 0.3s ease',
          }}>
            <div style={{
              width:'11px', height:'11px',
              background:'var(--a1)',
              clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
              animation:'pulse 2.5s ease infinite',
            }}/>
            {/* corner ticks */}
            {[
              {top:'-3px',left:'-3px'},
              {top:'-3px',right:'-3px'},
              {bottom:'-3px',left:'-3px'},
              {bottom:'-3px',right:'-3px'},
            ].map((pos,i) => (
              <div key={i} style={{
                position:'absolute', width:'5px', height:'5px',
                background:'var(--a1)', borderRadius:'1px',
                ...pos,
              }}/>
            ))}
          </div>
          <div>
            <div style={{
              fontFamily:'var(--display)', fontSize:'24px',
              letterSpacing:'4px', color:'var(--a1)', lineHeight:1,
            }}>
              VERITAI
            </div>
            <div style={{
              fontFamily:'var(--mono)', fontSize:'9px',
              color:'var(--dim)', letterSpacing:'2.5px', marginTop:'2px',
            }}>
              FACT VERIFICATION ENGINE
            </div>
          </div>
        </div>

        {/* right cluster — desktop */}
        <div className="header-right" style={{
          display:'flex', alignItems:'center', gap:'20px',
          fontFamily:'var(--mono)', fontSize:'11px',
        }}>
          <div className="header-status-text" style={{
            display:'flex', alignItems:'center', gap:'8px', color:'var(--dim)',
          }}>
            <span style={{
              display:'inline-block', width:'7px', height:'7px', borderRadius:'50%',
              background:'var(--green)',
              boxShadow:'0 0 8px var(--green)',
              animation:'pulse 1.5s ease infinite',
            }}/>
            <span>SYSTEM ONLINE</span>
          </div>
          <div style={{
            padding:'5px 14px',
            border:'1px solid var(--line2)',
            borderRadius:'var(--radius)',
            color:'var(--muted)', letterSpacing:'1px',
            fontSize:'10px',
          }}>
            {time.toLocaleTimeString('en-US',{hour12:false})}
          </div>
          <div className="header-model-badge" style={{
            padding:'5px 14px',
            background:'var(--a1-dim)',
            border:'1px solid var(--a1)',
            borderRadius:'var(--radius)',
            color:'var(--a1)', letterSpacing:'1.5px',
            fontSize:'10px', fontWeight:'500',
            boxShadow:'0 0 12px var(--a1-dim)',
          }}>
            ✦ GEMINI 2.0
          </div>

          {/* mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display:'none', background:'transparent',
              border:'1px solid var(--line2)', borderRadius:'var(--radius)',
              padding:'6px 8px', cursor:'pointer', color:'var(--dim)',
              fontSize:'16px', lineHeight:1,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── ticker tape ── */}
      <div className="ticker-tape" style={{
        height:'28px', overflow:'hidden',
        background:'linear-gradient(90deg, var(--bg1), var(--bg2), var(--bg1))',
        borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center',
      }}>
        <div style={{
          display:'inline-block',
          whiteSpace:'nowrap',
          fontFamily:'var(--mono)', fontSize:'10px',
          color:'var(--dim)', letterSpacing:'1.2px',
          animation:'ticker 45s linear infinite',
        }}>
          {tick}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0,
          background:'rgba(6,10,15,0.95)',
          backdropFilter:'blur(20px)',
          borderBottom:'1px solid var(--line2)',
          padding:'16px 20px',
          display:'flex', flexDirection:'column', gap:'12px',
          animation:'fadeIn 0.2s ease both',
          fontFamily:'var(--mono)', fontSize:'11px',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--dim)'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 8px var(--green)'}}/>
            SYSTEM ONLINE
          </div>
          <div style={{color:'var(--muted)'}}>
            {time.toLocaleTimeString('en-US',{hour12:false})}
          </div>
          <div style={{
            display:'inline-flex', padding:'5px 14px',
            background:'var(--a1-dim)', border:'1px solid var(--a1)',
            borderRadius:'var(--radius)', color:'var(--a1)',
            letterSpacing:'1.5px', fontSize:'10px', width:'fit-content',
          }}>
            ✦ GEMINI 2.0
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
