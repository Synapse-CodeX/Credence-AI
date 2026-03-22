import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      position:'relative', zIndex:1,
      borderTop:'1px solid var(--line2)',
      background:'rgba(6,10,15,0.9)',
      backdropFilter:'blur(16px)',
      padding:'32px 32px 24px',
      marginTop:'60px',
    }}>
      <div style={{
        maxWidth:'1280px', margin:'0 auto',
        display:'flex', flexWrap:'wrap', alignItems:'flex-start',
        justifyContent:'space-between', gap:'24px',
      }}>
        {/* branding */}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
            <div style={{
              width:'22px', height:'22px',
              border:'1px solid var(--a1)',
              borderRadius:'3px',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 8px var(--a1-dim)',
            }}>
              <div style={{
                width:'7px', height:'7px',
                background:'var(--a1)',
                clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
              }}/>
            </div>
            <span style={{
              fontFamily:'var(--display)', fontSize:'18px',
              letterSpacing:'3px', color:'var(--a1)',
            }}>VERITAI</span>
            <span style={{
              fontFamily:'var(--mono)', fontSize:'9px',
              color:'var(--dim)', letterSpacing:'1px',
              padding:'2px 8px', border:'1px solid var(--line)',
              borderRadius:'var(--radius)',
            }}>v1.0</span>
          </div>
          <p style={{
            fontFamily:'var(--mono)', fontSize:'11px',
            color:'var(--dim)', maxWidth:'380px',
            lineHeight:'1.7', letterSpacing:'0.3px',
          }}>
            AI-powered fact verification engine with claim extraction,
            cross-reference verification, and AI content detection.
          </p>
        </div>

        {/* powered by */}
        <div style={{textAlign:'right'}}>
          <div style={{
            fontFamily:'var(--mono)', fontSize:'9px',
            color:'var(--dim)', letterSpacing:'2px', marginBottom:'8px',
          }}>POWERED BY</div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            padding:'8px 16px',
            background:'var(--a1-dim)',
            border:'1px solid rgba(240,180,41,0.3)',
            borderRadius:'var(--radius)',
            fontFamily:'var(--mono)', fontSize:'11px',
            color:'var(--a1)', letterSpacing:'1.5px',
          }}>
            <span style={{fontSize:'14px'}}>✦</span>
            GOOGLE GEMINI
          </div>
          <div style={{
            fontFamily:'var(--mono)', fontSize:'9px',
            color:'var(--dim)', marginTop:'8px', letterSpacing:'0.5px',
          }}>
            Results are AI-generated and may contain errors.
            <br/>Always verify critical information independently.
          </div>
        </div>
      </div>

      {/* bottom divider & copyright */}
      <div style={{
        maxWidth:'1280px', margin:'20px auto 0',
        borderTop:'1px solid var(--line)',
        paddingTop:'16px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:'8px',
        fontFamily:'var(--mono)', fontSize:'9px',
        color:'var(--dim)', letterSpacing:'1px',
      }}>
        <span>© {new Date().getFullYear()} VERITAI — INTELLIGENCE VERIFICATION PLATFORM</span>
        <div style={{display:'flex',gap:'16px'}}>
          <span style={{cursor:'pointer',transition:'color 0.2s'}}
            onMouseEnter={e=>e.target.style.color='var(--a1)'}
            onMouseLeave={e=>e.target.style.color='var(--dim)'}
          >ABOUT</span>
          <span style={{cursor:'pointer',transition:'color 0.2s'}}
            onMouseEnter={e=>e.target.style.color='var(--a1)'}
            onMouseLeave={e=>e.target.style.color='var(--dim)'}
          >DOCS</span>
          <span style={{cursor:'pointer',transition:'color 0.2s'}}
            onMouseEnter={e=>e.target.style.color='var(--a1)'}
            onMouseLeave={e=>e.target.style.color='var(--dim)'}
          >GITHUB</span>
        </div>
      </div>
    </footer>
  );
}
