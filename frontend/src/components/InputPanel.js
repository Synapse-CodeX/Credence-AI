import React, { useState } from 'react';

const SAMPLES = [
  "The Great Wall of China is visible from space with the naked eye. It stretches over 13,170 miles and was built entirely during the Ming Dynasty. China is the world's most populous country with over 1.4 billion people.",
  "Albert Einstein failed mathematics as a child. He won the Nobel Prize in Physics in 1921 for his theory of relativity. Einstein was born in Ulm, Germany in 1879 and later became an American citizen.",
  "The human body contains 206 bones in adults. Approximately 70% of Earth's surface is covered by water. Honey never spoils and edible honey has been found in ancient Egyptian tombs.",
];

export default function InputPanel({ onAnalyze, loading }) {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const submit = () => {
    if (mode === 'text' && text.trim().length > 10) onAnalyze({ mode:'text', content:text });
    if (mode === 'url' && url.trim().length > 8) onAnalyze({ mode:'url', content:url });
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGo) submit();
  };

  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const canGo = !loading && (mode === 'text' ? text.trim().length > 10 : url.trim().length > 8);

  const loadSample = () => {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setText(s);
    setMode('text');
  };

  return (
    <div style={{animation:'fadeUp 0.4s ease both'}}>
      {/* panel header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:'20px', flexWrap:'wrap', gap:'12px',
      }}>
        <div className="section-label">
          <div className="section-label__bar" style={{background:'var(--a1)'}}/>
          <span className="section-label__text" style={{color:'var(--a1)', fontSize:'18px'}}>
            INPUT TERMINAL
          </span>
        </div>
        <div style={{display:'flex',gap:'6px'}} role="tablist">
          {[
            {id:'text', label:'TEXT INPUT', icon:'⌨'},
            {id:'url', label:'URL FETCH', icon:'🔗'},
          ].map(m => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className="btn-ghost"
              style={{
                background: mode === m.id ? 'var(--a1-dim)' : 'transparent',
                borderColor: mode === m.id ? 'var(--a1)' : undefined,
                color: mode === m.id ? 'var(--a1)' : undefined,
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{
        overflow:'hidden',
        borderColor: isFocused ? 'rgba(240,180,41,0.3)' : undefined,
        boxShadow: isFocused ? '0 0 30px rgba(240,180,41,0.08), 0 4px 30px rgba(0,0,0,0.3)' : undefined,
        transition:'border-color 0.3s, box-shadow 0.3s',
      }}>
        {/* top status bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 18px',
          background:'var(--bg2)', borderBottom:'1px solid var(--line)',
          fontFamily:'var(--mono)', fontSize:'10px', color:'var(--dim)',
          flexWrap:'wrap', gap:'8px',
        }}>
          <span style={{letterSpacing:'1.2px'}}>
            <span style={{color:'var(--a1)', marginRight:'6px'}}>▸</span>
            INPUT BUFFER — {mode.toUpperCase()} MODE
          </span>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            {mode === 'text' && (
              <span style={{letterSpacing:'0.5px'}}>
                <span style={{color: charCount > 5000 ? 'var(--orange)' : 'var(--dim)'}}>{wc}</span> words
                <span style={{margin:'0 6px',color:'var(--line2)'}}>|</span>
                <span style={{color: charCount > 5000 ? 'var(--orange)' : 'var(--dim)'}}>{charCount.toLocaleString()}</span> chars
              </span>
            )}
            <button
              onClick={loadSample}
              className="btn-ghost"
              style={{padding:'3px 12px', fontSize:'9px'}}
            >
              ↻ LOAD SAMPLE
            </button>
          </div>
        </div>

        <div style={{padding:'18px',position:'relative'}}>
          {/* line numbers */}
          {mode === 'text' && (
            <div style={{
              position:'absolute', left:'18px', top:'18px', bottom:'18px',
              width:'28px', display:'flex', flexDirection:'column',
              pointerEvents:'none',
            }}>
              {Array.from({length:9}, (_, i) => (
                <div key={i} style={{
                  fontFamily:'var(--mono)', fontSize:'12px',
                  color:'var(--bg3)', userSelect:'none',
                  lineHeight:'22.1px',
                }}>{i + 1}</div>
              ))}
            </div>
          )}

          {mode === 'text' ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={9}
              placeholder="// paste article, essay, or any text here..."
              aria-label="Text input for fact-checking"
              style={{
                width:'100%', background:'var(--bg0)',
                border:'1px solid var(--line2)', borderRadius:'var(--radius)',
                padding:'14px 16px 14px 48px',
                color:'var(--text)', fontSize:'13px',
                fontFamily:'var(--mono)', lineHeight:'1.7',
                outline:'none', resize:'vertical',
                transition:'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor='var(--a1)'; e.target.style.boxShadow='0 0 0 3px var(--a1-dim)'; setIsFocused(true); }}
              onBlur={e => { e.target.style.borderColor='var(--line2)'; e.target.style.boxShadow='none'; setIsFocused(false); }}
            />
          ) : (
            <div>
              <div style={{position:'relative'}}>
                <span style={{
                  position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)',
                  fontFamily:'var(--mono)', fontSize:'12px', color:'var(--dim)',
                }}>🌐</span>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canGo && submit()}
                  placeholder="https://example.com/news-article"
                  aria-label="URL input for fact-checking"
                  style={{
                    width:'100%', background:'var(--bg0)',
                    border:'1px solid var(--line2)', borderRadius:'var(--radius)',
                    padding:'14px 16px 14px 40px',
                    color:'var(--text)', fontSize:'13px',
                    fontFamily:'var(--mono)', lineHeight:'1.7',
                    outline:'none',
                    transition:'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor='var(--a1)'; e.target.style.boxShadow='0 0 0 3px var(--a1-dim)'; setIsFocused(true); }}
                  onBlur={e => { e.target.style.borderColor='var(--line2)'; e.target.style.boxShadow='none'; setIsFocused(false); }}
                />
              </div>
              <div style={{
                marginTop:'10px', fontFamily:'var(--mono)', fontSize:'10px',
                color:'var(--dim)', letterSpacing:'0.8px',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
                <span style={{color:'var(--orange)'}}>⚠</span>
                URL fetching requires backend on localhost:8000 — see README
              </div>
            </div>
          )}
        </div>

        {/* action bar */}
        <div className="input-actions" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px',
          background:'var(--bg2)', borderTop:'1px solid var(--line)',
          flexWrap:'wrap', gap:'10px',
        }}>
          <div style={{
            fontFamily:'var(--mono)', fontSize:'10px', color:'var(--dim)',
            letterSpacing:'1px', display:'flex', alignItems:'center', gap:'8px',
          }}>
            {canGo ? (
              <>
                <span style={{color:'var(--green)'}}>▶</span>
                <span>READY TO ANALYZE</span>
                <span style={{
                  color:'var(--dim)', fontSize:'9px',
                  padding:'2px 6px', border:'1px solid var(--line)',
                  borderRadius:'3px', opacity:0.7,
                }}>Ctrl+Enter</span>
              </>
            ) : (
              <span style={{opacity:0.7}}>// minimum 10 characters required</span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!canGo}
            className="btn-primary"
            id="analyze-button"
            aria-label="Start analysis"
          >
            {loading ? (
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{
                  display:'inline-block', width:'12px', height:'12px',
                  borderRadius:'50%', border:'2px solid #060a0f',
                  borderTopColor:'transparent', animation:'spin 0.6s linear infinite',
                }}/>
                PROCESSING...
              </span>
            ) : 'ANALYZE'}
          </button>
        </div>
      </div>
    </div>
  );
}
