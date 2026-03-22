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
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef(null);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recognitionRef.current = rec;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setText(transcript);
      setFileName(null);
    };
    rec.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleVoice = () => {
    if (listening) stopVoice();
    else startVoice();
  };
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const readFile = (file) => {
    if (!file) return;
    const allowed = ['text/plain', 'application/pdf', 'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'];
    // accept any text-ish file
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setText(content);
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

      {/* Mode selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          { id: 'factcheck', icon: '⚖', title: 'FACT CHECK', desc: 'Extract claims from text and verify each one against known sources with confidence scores.', color: 'var(--a1)', dimColor: 'var(--a1-dim)' },
          { id: 'aidetect',  icon: '◈', title: 'AI DETECTION', desc: 'Analyze writing style, tone and structure to determine if text was written by AI or a human.', color: 'var(--cyan)', dimColor: 'var(--cyan-dim)' },
        ].map(m => (
          <div key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '18px 20px',
            border: `1px solid ${mode === m.id ? m.color : 'var(--line2)'}`,
            borderLeft: `3px solid ${mode === m.id ? m.color : 'var(--bg3)'}`,
            borderRadius: 'var(--radius-lg)',
            background: mode === m.id ? m.dimColor : 'var(--bg1)',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: mode === m.id ? `0 0 20px ${m.dimColor}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', color: m.color }}>{m.icon}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: '18px', letterSpacing: '2px', color: mode === m.id ? m.color : 'var(--muted)' }}>{m.title}</span>
              {mode === m.id && (
                <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}`, animation: 'pulse 1.5s ease infinite' }} />
              )}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: mode === m.id ? 'var(--muted)' : 'var(--dim)', lineHeight: '1.6' }}>{m.desc}</div>
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
          padding: '8px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ letterSpacing: '1px' }}>
              // {mode === 'factcheck' ? 'PASTE OR UPLOAD TEXT TO FACT-CHECK' : 'PASTE OR UPLOAD TEXT TO ANALYZE'}
            </span>
            {fileName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '2px 8px', background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`, borderRadius: 'var(--radius)',
                color: accentColor, fontSize: '9px', letterSpacing: '1px',
              }}>
                <span>📄</span>{fileName}
                <span
                  onClick={() => { setText(''); setFileName(null); }}
                  style={{ cursor: 'pointer', opacity: 0.6, marginLeft: '2px' }}
                >✕</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--dim)' }}>{wc} words</span>
            <button onClick={loadSample} style={{
              background: 'transparent', border: '1px solid var(--line2)',
              color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '10px',
              padding: '3px 10px', cursor: 'pointer', borderRadius: 'var(--radius)',
              letterSpacing: '1px', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = accentColor; e.target.style.color = accentColor; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
            >LOAD SAMPLE</button>
          </div>
        </div>

        {/* textarea with line numbers */}
        <div style={{ display: 'flex' }}>
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
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setFileName(null); }}
            placeholder={dragOver
              ? '  ↓ drop file here...'
              : mode === 'factcheck'
                ? '  // paste article, essay, news — any text with factual claims...'
                : '  // paste any text — article, email, essay — to detect AI authorship...'}
            rows={9}
            style={{
              flex: 1, background: 'var(--bg0)', border: 'none',
              padding: '14px 16px', color: 'var(--text)',
              fontSize: '13px', fontFamily: 'var(--mono)', lineHeight: '1.7',
              resize: 'vertical', outline: 'none',
            }}
          />
        </div>

        {/* action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--line)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '1px' }}>
            {dragOver
              ? '↓ DROP FILE TO LOAD'
              : canGo
                ? `▶ READY — ${mode === 'factcheck' ? 'WILL EXTRACT & VERIFY CLAIMS' : 'WILL DETECT AI AUTHORSHIP'}`
                : '// minimum 10 characters required'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.html,.csv,.js,.py,.json,.xml,.log"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* 🎤 Voice input button */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={listening ? 'Stop recording' : 'Start voice input'}
                style={{
                  width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: listening ? 'rgba(255,69,96,0.12)' : 'transparent',
                  border: `1px solid ${listening ? 'var(--red)' : 'var(--line2)'}`,
                  borderRadius: 'var(--radius)',
                  color: listening ? 'var(--red)' : 'var(--dim)',
                  fontSize: '16px', lineHeight: 1,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: listening ? '0 0 12px rgba(255,69,96,0.3)' : 'none',
                  animation: listening ? 'pulse 1s ease infinite' : 'none',
                }}
                onMouseEnter={e => {
                  if (!listening) {
                    e.currentTarget.style.borderColor = 'var(--red)';
                    e.currentTarget.style.color = 'var(--red)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,69,96,0.2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!listening) {
                    e.currentTarget.style.borderColor = 'var(--line2)';
                    e.currentTarget.style.color = 'var(--dim)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >🎤</button>
            )}

            {/* + upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload a text file"
              style={{
                width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: `1px solid var(--line2)`,
                borderRadius: 'var(--radius)',
                color: 'var(--dim)', fontSize: '20px', lineHeight: 1,
                cursor: 'pointer', transition: 'all 0.15s',
                fontWeight: '300',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
                e.currentTarget.style.boxShadow = `0 0 10px ${accentGlow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--line2)';
                e.currentTarget.style.color = 'var(--dim)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >+</button>

            {/* Analyze button */}
            <button
              onClick={submit}
              disabled={!canGo}
              style={{
                padding: '10px 36px',
                background: canGo ? accentColor : 'var(--bg3)',
                border: 'none', borderRadius: 'var(--radius)',
                color: canGo ? '#060a0f' : 'var(--dim)',
                fontFamily: 'var(--display)', fontSize: '16px', letterSpacing: '3px',
                cursor: canGo ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                boxShadow: canGo ? `0 0 20px ${accentGlow}` : 'none',
              }}
              onMouseEnter={e => { if (canGo) { e.target.style.filter = 'brightness(1.15)'; e.target.style.boxShadow = `0 0 30px ${accentGlow}`; } }}
              onMouseLeave={e => { if (canGo) { e.target.style.filter = 'none'; e.target.style.boxShadow = `0 0 20px ${accentGlow}`; } }}
            >
              {loading ? 'PROCESSING...' : mode === 'factcheck' ? 'FACT CHECK' : 'DETECT AI'}
            </button>
          </div>
        </div>
      </div>

      {/* drag hint */}
      <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px', textAlign: 'right' }}>
        🎤 VOICE · + UPLOAD · DRAG & DROP .txt .md .html .csv files
      </div>
    </div>
  );
}