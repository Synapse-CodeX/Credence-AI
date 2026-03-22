import React from 'react';

const VERDICT_CFG = [
  { key: 'TRUE',           label: 'TRUE',         color: 'var(--green)',  bg: 'var(--green-dim)'  },
  { key: 'PARTIALLY TRUE', label: 'PARTIAL',       color: 'var(--orange)', bg: 'var(--orange-dim)' },
  { key: 'FALSE',          label: 'FALSE',         color: 'var(--red)',    bg: 'var(--red-dim)'    },
  { key: 'UNVERIFIABLE',   label: 'UNVERIFIABLE',  color: 'var(--muted)',  bg: 'var(--line)'       },
];

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ padding: '14px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg2)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: '32px', color: color || 'var(--a1)', letterSpacing: '1px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// Confidence Heatmap
function ConfidenceHeatmap({ claims, results }) {
  if (!claims.length) return null;
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>CONFIDENCE HEATMAP</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {claims.map((c, i) => {
          const r = results[i];
          const conf = r?.confidence || 0;
          const color = conf >= 75 ? 'var(--green)' : conf >= 40 ? 'var(--orange)' : 'var(--red)';
          return (
            <div key={i} title={`Claim ${i + 1}: ${conf}% confidence`} style={{
              flex: 1, minWidth: '40px', height: '32px',
              background: r ? `${color}${Math.round(conf * 0.8 + 20).toString(16).padStart(2, '0')}` : 'var(--bg3)',
              borderRadius: 'var(--radius)', border: `1px solid ${r ? color + '44' : 'var(--line)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: '10px', color: r ? color : 'var(--dim)',
              transition: 'all 0.5s ease', cursor: 'default',
              boxShadow: r ? `0 0 8px ${color}30` : 'none',
            }}>
              {r ? `${conf}%` : '—'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SummaryReport({ claims, results, aiDetection, onDownload, onShare }) {
  const counts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
  results.forEach(r => { if (r && counts[r.verdict] !== undefined) counts[r.verdict]++; });
  const total = results.filter(Boolean).length;
  const score = total > 0 ? Math.round(((counts.TRUE + counts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
  const avgConf = total > 0 ? Math.round(results.filter(Boolean).reduce((a, r) => a + (r.confidence || 0), 0) / total) : 0;
  const scoreColor = score >= 75 ? 'var(--green)' : score >= 40 ? 'var(--orange)' : 'var(--red)';

  return (
    <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden', animation: 'fadeUp 0.4s ease 0.15s both' }}>
      <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '3px', height: '16px', background: 'var(--a1)' }} />
          <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--a1)' }}>ACCURACY REPORT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onDownload && (
            <button onClick={onDownload} style={{ padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--line)'; }}>↓ DL</button>
          )}
          {onShare && (
            <button onClick={onShare} style={{ padding: '4px 10px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,232,135,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,232,135,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--line)'; }}>⬡ SHARE</button>
          )}
          <div style={{ width: '1px', height: '16px', background: 'var(--line)' }} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', padding: '3px 8px', border: '1px solid var(--line)', letterSpacing: '1px' }}>{total} CLAIMS</div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Score + Avg conf */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Stat label="ACCURACY SCORE" value={`${score}%`} color={scoreColor} sub="weighted verdict" />
          <Stat label="AVG CONFIDENCE" value={`${avgConf}%`} color="var(--cyan)" sub="across claims" />
        </div>

        {/* Heatmap */}
        <ConfidenceHeatmap claims={claims} results={results} />

        {/* Verdict breakdown bars */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '10px' }}>VERDICT BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {VERDICT_CFG.map(v => {
              const cnt = counts[v.key] || 0;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <div key={v.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '10px', color: cnt > 0 ? v.color : 'var(--dim)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    <span>{v.label}</span><span>{cnt} / {pct}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: v.color, borderRadius: '2px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: cnt > 0 ? `0 0 8px ${v.color}` : 'none' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Detection mini */}
        {aiDetection && (
          <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>AI CONTENT</div>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '26px', color: 'var(--red)', letterSpacing: '1px' }}>{aiDetection.aiScore}%</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>AI</div>
                </div>
                <div style={{ width: '1px', background: 'var(--line)', margin: '0 8px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '26px', color: 'var(--green)', letterSpacing: '1px' }}>{aiDetection.humanScore}%</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>HUMAN</div>
                </div>
              </div>
              <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${aiDetection.aiScore}%`, background: 'linear-gradient(90deg,var(--red),var(--orange))', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'inline-flex', padding: '3px 10px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '1.5px' }}>
                {aiDetection.verdict}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}