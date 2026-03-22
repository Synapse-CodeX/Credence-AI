import React, { useState, useRef, useEffect } from 'react';

const SAMPLES = {
  factcheck: [
    "The Great Wall of China is visible from space with the naked eye. It stretches over 13,170 miles and was built entirely during the Ming Dynasty. China is the most populous country with over 1.4 billion people.",
    "Albert Einstein failed mathematics as a child. He won the Nobel Prize in Physics in 1921 for his theory of relativity. Einstein was born in Ulm, Germany in 1879.",
    "The human body contains 206 bones in adults. Approximately 70% of Earth surface is covered by water. Honey never spoils — edible honey has been found in ancient Egyptian tombs.",
  ],
  aidetect: [
    "In today's rapidly evolving technological landscape, artificial intelligence has emerged as a transformative force that is reshaping industries across the globe. The implications of this paradigm shift are both profound and far-reaching, necessitating a comprehensive examination of its multifaceted impacts.",
    "I burned my tongue on coffee again this morning — third time this week. You'd think I'd learn. Anyway, ran into my neighbor Dave who told me his cat knocked over his entire bookshelf last night. Classic.",
    "The quarterly results demonstrate a significant uptick in key performance indicators, with revenue streams showing consistent year-over-year growth. Stakeholder value has been optimized through strategic realignment of core business verticals.",
  ],
};

export default function InputPanel({ onAnalyze, loading }) {
  const [mode, setMode] = useState('factcheck');
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target.result);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const submit = () => {
    if (text.trim().length > 10) onAnalyze({ mode, content: text });
  };

  const loadSample = () => {
    const arr = SAMPLES[mode];
    setText(arr[Math.floor(Math.random() * arr.length)]);
    setFileName(null);
  };

  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const canGo = !loading && text.trim().length > 10;
  const accentColor = mode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)';
  const accentGlow = mode === 'factcheck' ? 'var(--a1-glow)' : 'rgba(0,212,255,0.25)';

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* Mode selector — stacks on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '10px',
        marginBottom: '16px',
      }}>
        {[
          { id: 'factcheck', icon: '⚖', title: 'FACT CHECK', desc: 'Extract & verify claims against sources with confidence scores.', color: 'var(--a1)', dimColor: 'var(--a1-dim)' },
          { id: 'aidetect', icon: '◈', title: 'AI DETECTION', desc: 'Analyze writing style to determine AI or human authorship.', color: 'var(--cyan)', dimColor: 'var(--cyan-dim)' },
        ].map(m => (
          <div key={m.id} onClick={() => setMode(m.id)} style={{
            padding: isMobile ? '14px 16px' : '18px 20px',
            border: `1px solid ${mode === m.id ? m.color : 'var(--line2)'}`,
            borderLeft: `3px solid ${mode === m.id ? m.color : 'var(--bg3)'}`,
            borderRadius: 'var(--radius-lg)',
            background: mode === m.id ? m.dimColor : 'var(--bg1)',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: mode === m.id ? `0 0 20px ${m.dimColor}` : 'none',
            display: 'flex', alignItems: isMobile ? 'center' : 'flex-start',
            flexDirection: isMobile ? 'row' : 'column',
            gap: isMobile ? '12px' : '0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? 0 : '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '18px', color: m.color }}>{m.icon}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: isMobile ? '16px' : '18px', letterSpacing: '2px', color: mode === m.id ? m.color : 'var(--muted)' }}>{m.title}</span>
              {mode === m.id && !isMobile && (
                <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}`, animation: 'pulse 1.5s ease infinite' }} />
              )}
            </div>
            {!isMobile && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: mode === m.id ? 'var(--muted)' : 'var(--dim)', lineHeight: '1.6' }}>{m.desc}</div>
            )}
            {isMobile && mode === m.id && (
              <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Editor box */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `1px solid ${dragOver ? accentColor : 'var(--line2)'}`,
          borderRadius: 'var(--radius-lg)',
          background: dragOver ? `rgba(240,180,41,0.03)` : 'var(--bg1)',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          boxShadow: dragOver ? `0 0 20px ${accentGlow}` : 'none',
        }}
      >
        {/* top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '7px 12px' : '8px 16px',
          background: 'var(--bg2)', borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
          gap: '8px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '140px' : 'none' }}>
              // {mode === 'factcheck' ? 'PASTE TEXT TO FACT-CHECK' : 'PASTE TEXT TO ANALYZE'}
            </span>
            {fileName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`, borderRadius: 'var(--radius)',
                color: accentColor, fontSize: '9px', letterSpacing: '1px',
                flexShrink: 0,
              }}>
                📄 {fileName.length > 12 ? fileName.slice(0, 12) + '…' : fileName}
                <span onClick={() => { setText(''); setFileName(null); }} style={{ cursor: 'pointer', opacity: 0.6, marginLeft: '2px' }}>✕</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ color: 'var(--dim)', fontSize: '9px' }}>{wc}w</span>
            <button onClick={loadSample} style={{
              background: 'transparent', border: '1px solid var(--line2)',
              color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '9px',
              padding: '2px 8px', cursor: 'pointer', borderRadius: 'var(--radius)',
              letterSpacing: '0.5px', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { e.target.style.borderColor = accentColor; e.target.style.color = accentColor; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
            >SAMPLE</button>
          </div>
        </div>

        {/* textarea — no line numbers on mobile */}
        <div style={{ display: 'flex' }}>
          {!isMobile && (
            <div style={{
              padding: '14px 10px', background: 'var(--bg0)',
              borderRight: '1px solid var(--line)',
              display: 'flex', flexDirection: 'column',
              userSelect: 'none', minWidth: '36px',
            }}>
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--bg3)', lineHeight: '22.1px', textAlign: 'right' }}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setFileName(null); }}
            placeholder={dragOver
              ? '  ↓ drop file here...'
              : mode === 'factcheck'
                ? '  // paste article, essay, news — any text with factual claims...'
                : '  // paste any text — article, email, essay — to detect AI authorship...'}
            rows={isMobile ? 7 : 9}
            style={{
              flex: 1, background: 'var(--bg0)', border: 'none',
              padding: isMobile ? '12px 14px' : '14px 16px', color: 'var(--text)',
              fontSize: '13px', fontFamily: 'var(--mono)', lineHeight: '1.7',
              resize: 'vertical', outline: 'none', width: '100%',
            }}
          />
        </div>

        {/* action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: 'var(--bg2)', borderTop: '1px solid var(--line)',
          gap: '8px', flexWrap: 'wrap',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.5px', flex: 1 }}>
            {dragOver ? '↓ DROP FILE' : canGo ? `▶ READY` : '// min 10 chars'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.html,.csv,.js,.py,.json,.xml,.log"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload a text file"
              style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: `1px solid var(--line2)`,
                borderRadius: 'var(--radius)',
                color: 'var(--dim)', fontSize: '20px', lineHeight: 1,
                cursor: 'pointer', transition: 'all 0.15s', fontWeight: '300',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--dim)'; }}
            >+</button>

            <button
              onClick={submit}
              disabled={!canGo}
              style={{
                padding: isMobile ? '9px 24px' : '10px 36px',
                background: canGo ? accentColor : 'var(--bg3)',
                border: 'none', borderRadius: 'var(--radius)',
                color: canGo ? '#060a0f' : 'var(--dim)',
                fontFamily: 'var(--display)', fontSize: isMobile ? '14px' : '16px', letterSpacing: '2px',
                cursor: canGo ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                boxShadow: canGo ? `0 0 20px ${accentGlow}` : 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (canGo) { e.target.style.filter = 'brightness(1.15)'; } }}
              onMouseLeave={e => { if (canGo) { e.target.style.filter = 'none'; } }}
            >
              {loading ? 'PROCESSING...' : mode === 'factcheck' ? 'FACT CHECK' : 'DETECT AI'}
            </button>
          </div>
        </div>
      </div>

      {!isMobile && (
        <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px', textAlign: 'right' }}>
          + UPLOAD or DRAG & DROP .txt .md .html .csv files
        </div>
      )}
    </div>
  );
}