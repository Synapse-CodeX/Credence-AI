import React, { useState } from 'react';
import VerdictBadge from './VerdictBadge';

const verdictColor = {
  'TRUE': 'var(--green)', 'FALSE': 'var(--red)',
  'PARTIALLY TRUE': 'var(--orange)', 'UNVERIFIABLE': 'var(--muted)',
};
const verdictBg = {
  'TRUE': 'rgba(0,232,135,0.12)', 'FALSE': 'rgba(255,69,96,0.12)',
  'PARTIALLY TRUE': 'rgba(255,140,66,0.12)', 'UNVERIFIABLE': 'rgba(255,255,255,0.06)',
};

export default function ClaimHighlight({ text, claims, results }) {
  const [tooltip, setTooltip] = useState(null); // { claim, result, x, y }

  if (!claims.length || !results.length) return null;

  // Build highlighted version of text
  let remaining = text;
  const segments = [];

  claims.forEach((claim, i) => {
    const result = results[i];
    if (!result || !claim.context) return;

    const idx = remaining.indexOf(claim.context);
    if (idx === -1) return;

    // before match
    if (idx > 0) segments.push({ type: 'text', content: remaining.slice(0, idx) });

    // match
    segments.push({ type: 'highlight', content: remaining.slice(idx, idx + claim.context.length), claim, result, index: i });
    remaining = remaining.slice(idx + claim.context.length);
  });

  if (remaining) segments.push({ type: 'text', content: remaining });
  if (!segments.some(s => s.type === 'highlight')) return null;

  return (
    <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '16px', background: 'var(--a1)' }} />
        <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--a1)' }}>CLAIM OVERLAY</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>hover to inspect</span>
      </div>

      <div style={{ padding: '16px', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', lineHeight: '2', letterSpacing: '0.3px' }}>
          {segments.map((seg, i) => {
            if (seg.type === 'text') return <span key={i}>{seg.content}</span>;
            const color = verdictColor[seg.result.verdict] || 'var(--muted)';
            const bg = verdictBg[seg.result.verdict] || 'rgba(255,255,255,0.06)';
            return (
              <span
                key={i}
                onMouseEnter={e => {
                  const rect = e.target.getBoundingClientRect();
                  setTooltip({ claim: seg.claim, result: seg.result, top: e.target.offsetTop - 10 });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  background: bg,
                  borderBottom: `2px solid ${color}`,
                  padding: '1px 2px',
                  borderRadius: '2px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s',
                  boxShadow: `0 0 8px ${color}20`,
                }}
              >
                {seg.content}
              </span>
            );
          })}
        </p>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', left: '16px', right: '16px',
            bottom: '16px',
            background: 'var(--bg2)', border: `1px solid ${verdictColor[tooltip.result.verdict] || 'var(--line2)'}`,
            borderRadius: 'var(--radius-lg)', padding: '12px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 10, animation: 'fadeUp 0.15s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <VerdictBadge verdict={tooltip.result.verdict} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>
                {tooltip.result.confidence}% confidence
              </span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6' }}>
              {tooltip.result.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[['TRUE', 'var(--green)'], ['PARTIALLY TRUE', 'var(--orange)'], ['FALSE', 'var(--red)'], ['UNVERIFIABLE', 'var(--muted)']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '2px', background: color, borderRadius: '1px' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.5px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}