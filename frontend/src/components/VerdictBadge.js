import React from 'react';

const V = {
  'TRUE':           { color:'var(--green)',  bg:'var(--green-dim)',  symbol:'▲', label:'TRUE',        glow:'rgba(0,232,135,0.2)' },
  'FALSE':          { color:'var(--red)',    bg:'var(--red-dim)',    symbol:'▼', label:'FALSE',       glow:'rgba(255,69,96,0.2)' },
  'PARTIALLY TRUE': { color:'var(--orange)', bg:'var(--orange-dim)', symbol:'◆', label:'PARTIAL',     glow:'rgba(255,140,66,0.2)' },
  'UNVERIFIABLE':   { color:'var(--muted)',  bg:'var(--line)',       symbol:'?', label:'UNVERIFIABLE', glow:'rgba(255,255,255,0.05)' },
};

export default function VerdictBadge({ verdict, size='sm' }) {
  const cfg = V[verdict] || V['UNVERIFIABLE'];
  const lg = size === 'lg';
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap: lg ? '8px' : '6px',
      padding: lg ? '8px 16px' : '5px 11px',
      background: cfg.bg,
      border:`1px solid ${cfg.color}`,
      borderRadius: lg ? 'var(--radius-lg)' : 'var(--radius)',
      color: cfg.color,
      fontFamily:'var(--mono)',
      fontSize: lg ? '12px' : '10px',
      letterSpacing:'1.5px',
      fontWeight:'500',
      flexShrink:0,
      boxShadow: `0 0 12px ${cfg.glow}`,
      transition:'all 0.2s ease',
      animation:'countup 0.3s ease both',
    }}>
      <span style={{fontSize: lg ? '11px' : '9px', lineHeight:1}}>{cfg.symbol}</span>
      {cfg.label}
    </div>
  );
}
