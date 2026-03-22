import React from 'react';

const BIAS_CONFIG = {
  'LEFT':         { color: '#60a5fa', pos: 0   },
  'CENTER-LEFT':  { color: '#93c5fd', pos: 25  },
  'CENTER':       { color: 'var(--green)', pos: 50  },
  'CENTER-RIGHT': { color: '#fca5a5', pos: 75  },
  'RIGHT':        { color: 'var(--red)', pos: 100 },
  'UNKNOWN':      { color: 'var(--dim)', pos: 50  },
};

const TONE_CONFIG = {
  'NEUTRAL':        { color: 'var(--green)',  icon: '◎' },
  'SENSATIONALIST': { color: 'var(--orange)', icon: '⚡' },
  'ALARMIST':       { color: 'var(--red)',    icon: '⚠' },
  'PROMOTIONAL':    { color: 'var(--cyan)',   icon: '★' },
  'CRITICAL':       { color: '#a78bfa',       icon: '◈' },
};

export default function BiasPanel({ bias }) {
  if (!bias) return null;
  const bc = BIAS_CONFIG[bias.overallBias] || BIAS_CONFIG['UNKNOWN'];
  const tc = TONE_CONFIG[bias.emotionalTone] || TONE_CONFIG['NEUTRAL'];

  return (
    <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '16px', background: '#a78bfa' }} />
        <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px', color: '#a78bfa' }}>BIAS REPORT</span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Political bias spectrum */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '10px' }}>POLITICAL LEAN</div>
          <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #60a5fa, #93c5fd, var(--green), #fca5a5, var(--red))', marginBottom: '8px' }}>
            <div style={{
              position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
              left: `${Math.min(100, Math.max(0, (bias.biasScore + 100) / 2))}%`,
              width: '12px', height: '12px', borderRadius: '50%',
              background: bc.color, border: '2px solid var(--bg0)',
              boxShadow: `0 0 8px ${bc.color}`,
              transition: 'left 1s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)' }}>
            <span>LEFT</span><span>CENTER</span><span>RIGHT</span>
          </div>
          <div style={{ marginTop: '8px', display: 'inline-flex', padding: '3px 10px', border: `1px solid ${bc.color}44`, borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '10px', color: bc.color, letterSpacing: '1px', background: `${bc.color}10` }}>
            {bias.overallBias}
          </div>
        </div>

        {/* Objectivity score */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '6px' }}>
            <span>OBJECTIVITY</span><span style={{ color: 'var(--text)' }}>{bias.objectivityScore}%</span>
          </div>
          <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${bias.objectivityScore}%`, background: 'var(--green)', transition: 'width 1s ease', boxShadow: '0 0 6px var(--green)' }} />
          </div>
        </div>

        {/* Emotional tone */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>TONE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--mono)', fontSize: '10px', color: tc.color, letterSpacing: '1px' }}>
            <span>{tc.icon}</span>{bias.emotionalTone}
          </div>
        </div>

        {/* Biased phrases */}
        {bias.biasedPhrases?.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>FLAGGED PHRASES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {bias.biasedPhrases.map((p, i) => (
                <div key={i} style={{ padding: '3px 10px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '10px', color: '#a78bfa' }}>
                  "{p}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {bias.summary && (
          <div style={{ padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6' }}>
            {bias.summary}
          </div>
        )}
      </div>
    </div>
  );
}