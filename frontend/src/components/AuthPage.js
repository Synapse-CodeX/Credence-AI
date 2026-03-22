import React from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import Background from './Background';

export default function AuthPage({ onSuccess }) {
  const [tab, setTab] = React.useState('signin');
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    if (isSignedIn && onSuccess) onSuccess();
  }, [isSignedIn, onSuccess]);

  const clerkAppearance = {
    variables: {
      colorPrimary: '#f0b429',
      colorBackground: 'transparent',
      colorInputBackground: '#060a0f',
      colorInputText: '#e8edf5',
      colorText: '#e8edf5',
      colorTextSecondary: '#6b7a9e',
      colorNeutral: '#182030',
      borderRadius: '4px',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '13px',
    },
    elements: {
      rootBox: { width: '100%' },
      card: { background: 'transparent', border: 'none', boxShadow: 'none', borderRadius: '0', padding: '0', width: '100%' },
      headerTitle: { fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '20px' },
      headerSubtitle: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' },
      formButtonPrimary: {
        background: '#f0b429', color: '#060a0f',
        fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '15px',
        boxShadow: '0 0 20px rgba(240,180,41,0.3)',
      },
      footerActionLink: { color: '#f0b429' },
      formFieldInput: { background: '#060a0f', borderColor: '#182030', color: '#e8edf5' },
      dividerLine: { background: '#182030' },
      dividerText: { color: '#6b7a9e' },
      socialButtonsBlockButton: { background: '#111820', borderColor: '#182030', color: '#e8edf5' },
      socialButtonsBlockButtonText: { color: '#e8edf5' },
      footer: { display: 'none' },
    },
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Background />

      {/* Minimal top nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 40px',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(6,10,15,0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ width: '28px', height: '28px', border: '1px solid var(--a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px var(--a1-glow)' }}>
          <div style={{ width: '9px', height: '9px', background: 'var(--a1)', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', animation: 'pulse 2s ease infinite' }} />
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: '20px', letterSpacing: '3px', color: 'var(--a1)' }}>VERITAI</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginTop: '2px' }}>FACT VERIFICATION ENGINE</div>
      </nav>

      {/* Centered layout */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: '860px', width: '100%',
          border: '1px solid var(--line2)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: 'var(--bg1)',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.5s ease both',
        }}>

          {/* LEFT — branding panel */}
          <div style={{
            padding: '48px 40px',
            background: 'var(--bg0)',
            borderRight: '1px solid var(--line2)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* bg glow */}
            <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '20px' }}>// ACCESS CONTROL</div>

            <h1 style={{ fontFamily: 'var(--display)', fontSize: '56px', letterSpacing: '3px', lineHeight: 0.9, color: 'var(--text)', marginBottom: '20px' }}>
              VERIFY<br /><span style={{ color: 'var(--a1)' }}>TRUTH</span>
            </h1>

            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', lineHeight: '1.8', letterSpacing: '0.3px', marginBottom: '32px' }}>
              Sign in to access the AI-powered<br />fact-checking and content<br />verification platform.
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '⚖', label: 'Claim Extraction & Verification' },
                { icon: '🌐', label: 'Real-time Tavily Web Search' },
                { icon: '◈', label: 'AI Content Detection' },
                { icon: '🖼', label: 'Deepfake Image Analysis' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.3px' }}>
                  <span style={{ color: 'var(--a1)', fontSize: '13px', flexShrink: 0 }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>
              🔒 SECURED BY CLERK
            </div>
          </div>

          {/* RIGHT — auth panel */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', gap: '4px', marginBottom: '24px',
              background: 'var(--bg2)', border: '1px solid var(--line2)',
              borderRadius: 'var(--radius-lg)', padding: '4px',
            }}>
              {[{ id: 'signin', label: 'SIGN IN' }, { id: 'signup', label: 'SIGN UP' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: '8px',
                  background: tab === t.id ? 'var(--a1)' : 'transparent',
                  border: 'none', borderRadius: 'var(--radius)',
                  color: tab === t.id ? '#060a0f' : 'var(--dim)',
                  fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: tab === t.id ? '0 0 14px var(--a1-glow)' : 'none',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Clerk widget */}
            <div>
              {tab === 'signin'
                ? <SignIn routing="hash" appearance={clerkAppearance} />
                : <SignUp routing="hash" appearance={clerkAppearance} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}