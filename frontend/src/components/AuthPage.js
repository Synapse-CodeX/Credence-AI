import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Background from './Background';

export default function AuthPage() {
  const [tab, setTab] = React.useState('signin');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Background />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '20px 40px',
        borderBottom: '1px solid var(--line2)',
        background: 'rgba(6,10,15,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '1px solid var(--a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px var(--a1-glow)',
        }}>
          <div style={{
            width: '10px', height: '10px', background: 'var(--a1)',
            clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
            animation: 'pulse 2s ease infinite',
          }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '22px', letterSpacing: '3px', color: 'var(--a1)', lineHeight: 1 }}>VERITAI</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>FACT VERIFICATION ENGINE</div>
        </div>
      </div>

      {/* Main */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '460px', animation: 'fadeUp 0.5s ease both' }}>

          {/* Hero text */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '14px' }}>
              // ACCESS CONTROL
            </div>
            <h1 style={{
              fontFamily: 'var(--display)', fontSize: '52px',
              letterSpacing: '4px', lineHeight: 0.9,
              color: 'var(--text)', marginBottom: '16px',
            }}>
              VERIFY<br /><span style={{ color: 'var(--a1)' }}>TRUTH</span>
            </h1>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', lineHeight: '1.7', letterSpacing: '0.5px' }}>
              Sign in to access the AI-powered fact-checking<br />and content verification platform.
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '20px',
            background: 'var(--bg1)', border: '1px solid var(--line2)',
            borderRadius: 'var(--radius-lg)', padding: '4px',
          }}>
            {[{ id: 'signin', label: 'SIGN IN' }, { id: 'signup', label: 'SIGN UP' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '9px',
                background: tab === t.id ? 'var(--a1)' : 'transparent',
                border: 'none', borderRadius: 'var(--radius)',
                color: tab === t.id ? '#060a0f' : 'var(--dim)',
                fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: tab === t.id ? '0 0 16px var(--a1-glow)' : 'none',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Clerk component — appearance customized to match theme */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--line2)',
          }}>
            {tab === 'signin' ? (
              <SignIn
                routing="hash"
                appearance={{
                  variables: {
                    colorPrimary: '#f0b429',
                    colorBackground: '#0b1118',
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
                    card: { background: '#0b1118', border: 'none', boxShadow: 'none', borderRadius: '0' },
                    headerTitle: { fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '22px' },
                    headerSubtitle: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' },
                    formButtonPrimary: { background: '#f0b429', color: '#060a0f', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '15px' },
                    footerActionLink: { color: '#f0b429' },
                    identityPreviewText: { color: '#e8edf5' },
                    formFieldInput: { background: '#060a0f', borderColor: '#182030', color: '#e8edf5' },
                    dividerLine: { background: '#182030' },
                    dividerText: { color: '#6b7a9e' },
                    socialButtonsBlockButton: { background: '#111820', borderColor: '#182030', color: '#e8edf5' },
                    socialButtonsBlockButtonText: { color: '#e8edf5' },
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                appearance={{
                  variables: {
                    colorPrimary: '#f0b429',
                    colorBackground: '#0b1118',
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
                    card: { background: '#0b1118', border: 'none', boxShadow: 'none', borderRadius: '0' },
                    headerTitle: { fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '22px' },
                    headerSubtitle: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' },
                    formButtonPrimary: { background: '#f0b429', color: '#060a0f', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', fontSize: '15px' },
                    footerActionLink: { color: '#f0b429' },
                    formFieldInput: { background: '#060a0f', borderColor: '#182030', color: '#e8edf5' },
                    dividerLine: { background: '#182030' },
                    dividerText: { color: '#6b7a9e' },
                    socialButtonsBlockButton: { background: '#111820', borderColor: '#182030', color: '#e8edf5' },
                    socialButtonsBlockButtonText: { color: '#e8edf5' },
                  },
                }}
              />
            )}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>
            🔒 SECURED BY CLERK · YOUR DATA IS PRIVATE
          </div>
        </div>
      </div>
    </div>
  );
}