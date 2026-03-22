import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

export default function UserMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // close on outside click
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || '?';
  const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.emailAddresses?.[0]?.emailAddress;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 10px 5px 5px',
        background: open ? 'var(--a1-dim)' : 'transparent',
        border: `1px solid ${open ? 'var(--a1)' : 'var(--line2)'}`,
        borderRadius: 'var(--radius)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '3px', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '24px', height: '24px', borderRadius: '3px',
            background: 'var(--a1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontSize: '13px', color: '#060a0f', letterSpacing: '0',
          }}>{initial.toUpperCase()}</div>
        )}
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <span style={{ color: 'var(--dim)', fontSize: '8px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          width: '200px',
          background: 'var(--bg1)', border: '1px solid var(--line2)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease both',
          zIndex: 100,
        }}>
          {/* User info */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg2)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', fontWeight: 500, marginBottom: '2px' }}>{name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.5px' }}>
              {user?.emailAddresses?.[0]?.emailAddress}
            </div>
          </div>

          {/* Actions */}
          {[
            { label: 'MANAGE ACCOUNT', icon: '⚙', action: () => { openUserProfile(); setOpen(false); } },
            { label: 'SIGN OUT', icon: '→', action: () => signOut(), danger: true },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--line)',
              color: item.danger ? 'var(--red)' : 'var(--muted)',
              fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '12px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}