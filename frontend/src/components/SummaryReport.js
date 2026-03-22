import React from 'react';

const VERDICT_CFG = [
  { key:'TRUE',           label:'TRUE',        color:'var(--green)',  bg:'var(--green-dim)',  hex:'#00e887' },
  { key:'PARTIALLY TRUE', label:'PARTIAL',     color:'var(--orange)', bg:'var(--orange-dim)', hex:'#ff8c42' },
  { key:'FALSE',          label:'FALSE',       color:'var(--red)',    bg:'var(--red-dim)',    hex:'#ff4560' },
  { key:'UNVERIFIABLE',   label:'UNVERIFIABLE',color:'var(--muted)',  bg:'var(--line)',       hex:'#8888aa' },
];

/* ── SVG Donut Chart ── */
function DonutChart({ score, color, size = 100 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{position:'relative', width:size, height:size, margin:'0 auto'}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        {/* background ring */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="var(--bg3)" strokeWidth={strokeWidth}
        />
        {/* score arc */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)',
            filter:`drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {/* center text */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          fontFamily:'var(--display)', fontSize:'28px',
          color, letterSpacing:'1px', lineHeight:1,
          animation:'countup 0.6s ease both',
        }}>{score}%</div>
        <div style={{
          fontFamily:'var(--mono)', fontSize:'8px',
          color:'var(--dim)', letterSpacing:'1.5px', marginTop:'3px',
        }}>ACCURACY</div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{
      padding:'16px', border:'1px solid var(--line2)',
      borderRadius:'var(--radius)', background:'var(--bg2)',
      transition:'border-color 0.2s',
    }}>
      <div className="mono-label" style={{marginBottom:'10px'}}>{label}</div>
      <div style={{
        fontFamily:'var(--display)', fontSize:'30px',
        color: color || 'var(--a1)', letterSpacing:'1px', lineHeight:1,
        animation:'countup 0.5s ease both',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily:'var(--mono)', fontSize:'9px',
          color:'var(--dim)', marginTop:'6px', letterSpacing:'0.5px',
        }}>{sub}</div>
      )}
    </div>
  );
}

export default function SummaryReport({ claims, results, aiDetection }) {
  const counts = { TRUE:0, 'PARTIALLY TRUE':0, FALSE:0, UNVERIFIABLE:0 };
  results.forEach(r => { if (r && counts[r.verdict] !== undefined) counts[r.verdict]++; });
  const total = results.filter(Boolean).length;
  const score = total > 0 ? Math.round(((counts.TRUE + counts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
  const avgConf = total > 0 ? Math.round(results.filter(Boolean).reduce((a, r) => a + (r.confidence || 0), 0) / total) : 0;
  const scoreColor = score >= 75 ? '#00e887' : score >= 40 ? '#ff8c42' : '#ff4560';

  return (
    <div className="glass-card" style={{
      overflow:'hidden',
      animation:'slideInRight 0.4s ease 0.15s both',
    }}>
      {/* header */}
      <div style={{
        padding:'12px 18px', background:'var(--bg2)',
        borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'3px',height:'16px',background:'var(--a1)',borderRadius:'2px'}}/>
          <span style={{
            fontFamily:'var(--display)', fontSize:'14px',
            letterSpacing:'2.5px', color:'var(--a1)',
          }}>ACCURACY REPORT</span>
        </div>
        <div style={{
          fontFamily:'var(--mono)', fontSize:'9px', color:'var(--dim)',
          padding:'3px 10px', border:'1px solid var(--line)',
          borderRadius:'var(--radius)', letterSpacing:'1px',
        }}>
          {total} CLAIMS
        </div>
      </div>

      <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:'16px'}}>
        {/* donut chart */}
        <DonutChart score={score} color={scoreColor} size={110} />

        {/* stats row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <Stat label="WEIGHTED SCORE" value={`${score}%`} color={scoreColor} sub="based on verdicts"/>
          <Stat label="AVG CONFIDENCE" value={`${avgConf}%`} color="var(--cyan)" sub="across all claims"/>
        </div>

        {/* verdict breakdown */}
        <div>
          <div className="mono-label" style={{marginBottom:'12px'}}>VERDICT BREAKDOWN</div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {VERDICT_CFG.map(v => {
              const cnt = counts[v.key] || 0;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <div key={v.key}>
                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    fontFamily:'var(--mono)', fontSize:'10px',
                    color: cnt > 0 ? v.color : 'var(--dim)',
                    marginBottom:'5px', letterSpacing:'0.5px',
                  }}>
                    <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{
                        width:'6px', height:'6px', borderRadius:'50%',
                        background: cnt > 0 ? v.hex : 'var(--bg3)',
                        boxShadow: cnt > 0 ? `0 0 6px ${v.hex}` : 'none',
                      }}/>
                      {v.label}
                    </span>
                    <span>{cnt} / {pct}%</span>
                  </div>
                  <div style={{
                    height:'5px', background:'var(--bg3)',
                    borderRadius:'3px', overflow:'hidden',
                  }}>
                    <div style={{
                      height:'100%', width:`${pct}%`,
                      background: v.hex, borderRadius:'3px',
                      transition:'width 1s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: cnt > 0 ? `0 0 10px ${v.hex}40` : 'none',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Detection */}
        {aiDetection && (
          <div style={{
            border:'1px solid var(--line2)', borderRadius:'var(--radius-lg)',
            overflow:'hidden',
          }}>
            <div style={{
              padding:'10px 14px', background:'var(--bg2)',
              borderBottom:'1px solid var(--line)',
              fontFamily:'var(--mono)', fontSize:'9px',
              color:'var(--dim)', letterSpacing:'2px',
              display:'flex', alignItems:'center', gap:'8px',
            }}>
              <span style={{fontSize:'12px'}}>🤖</span>
              AI CONTENT DETECTION
            </div>
            <div style={{padding:'14px'}}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                marginBottom:'12px',
              }}>
                <div style={{textAlign:'center',flex:1}}>
                  <div style={{
                    fontFamily:'var(--display)', fontSize:'28px',
                    color:'var(--red)', letterSpacing:'1px',
                    animation:'countup 0.5s ease both',
                  }}>
                    {aiDetection.aiScore}%
                  </div>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:'9px',
                    color:'var(--dim)', letterSpacing:'1.2px', marginTop:'2px',
                  }}>AI-GENERATED</div>
                </div>
                <div style={{
                  width:'1px', background:'var(--line)', margin:'0 10px',
                }}/>
                <div style={{textAlign:'center',flex:1}}>
                  <div style={{
                    fontFamily:'var(--display)', fontSize:'28px',
                    color:'var(--green)', letterSpacing:'1px',
                    animation:'countup 0.5s ease 0.1s both',
                  }}>
                    {aiDetection.humanScore}%
                  </div>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:'9px',
                    color:'var(--dim)', letterSpacing:'1.2px', marginTop:'2px',
                  }}>HUMAN-WRITTEN</div>
                </div>
              </div>

              {/* split bar */}
              <div style={{
                height:'5px', background:'var(--bg3)',
                borderRadius:'3px', overflow:'hidden', marginBottom:'10px',
                position:'relative',
              }}>
                <div style={{
                  height:'100%', width:`${aiDetection.aiScore}%`,
                  background:'linear-gradient(90deg, #ff4560, #ff8c42)',
                  transition:'width 1s ease',
                  borderRadius:'3px',
                }}/>
              </div>

              {/* verdict badge */}
              <div style={{
                display:'inline-flex', padding:'4px 12px',
                border:'1px solid var(--line2)', borderRadius:'var(--radius)',
                fontFamily:'var(--mono)', fontSize:'9px',
                color: aiDetection.verdict === 'LIKELY AI' ? 'var(--red)' :
                       aiDetection.verdict === 'LIKELY HUMAN' ? 'var(--green)' : 'var(--muted)',
                letterSpacing:'1.5px',
                background: aiDetection.verdict === 'LIKELY AI' ? 'var(--red-dim)' :
                            aiDetection.verdict === 'LIKELY HUMAN' ? 'var(--green-dim)' : 'transparent',
              }}>{aiDetection.verdict}</div>

              {/* signals */}
              {aiDetection.signals?.length > 0 && (
                <div style={{
                  marginTop:'12px', display:'flex',
                  flexDirection:'column', gap:'5px',
                }}>
                  {aiDetection.signals.map((s, i) => (
                    <div key={i} style={{
                      fontFamily:'var(--mono)', fontSize:'10px', color:'var(--dim)',
                      display:'flex', gap:'8px', alignItems:'flex-start',
                      lineHeight:'1.5',
                    }}>
                      <span style={{color:'var(--a1)',flexShrink:0,marginTop:'1px'}}>›</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
