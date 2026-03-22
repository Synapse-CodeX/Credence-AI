import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startVerification } from '../services/api';
import VerdictBadge from './VerdictBadge';

// ── Claim result card (compact for live mode) ─────────────────────────────
function LiveClaimCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const verdictColor = {
    'TRUE': 'var(--green)', 'FALSE': 'var(--red)',
    'PARTIALLY TRUE': 'var(--orange)', 'UNVERIFIABLE': 'var(--muted)',
  };
  const color = verdictColor[item.verdict] || 'var(--muted)';
  const age = Math.round((Date.now() - item.timestamp) / 1000);
  const ageStr = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;

  return (
    <div style={{
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg1)',
      overflow: 'hidden',
      animation: 'fadeUp 0.4s ease both',
      transition: 'all 0.3s',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
      >
        {/* index */}
        <div style={{
          width: '22px', height: '22px', flexShrink: 0, marginTop: '1px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}44`, borderRadius: 'var(--radius)',
          fontFamily: 'var(--mono)', fontSize: '10px', color,
          background: `${color}08`,
        }}>{String(index + 1).padStart(2, '0')}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.5', marginBottom: '4px' }}>
            {item.claim}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' }}>{ageStr}</span>
            {item.confidence !== undefined && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color }}>
                {item.confidence}% conf
              </span>
            )}
            {item.sources?.length > 0 && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--cyan)' }}>
                {item.sources.length} source{item.sources.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <VerdictBadge verdict={item.verdict} />
          <span style={{ color: 'var(--dim)', fontSize: '10px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)', background: 'var(--bg0)', animation: 'fadeIn 0.2s ease both' }}>
          {item.explanation && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6' }}>
              {item.explanation}
            </div>
          )}
          {item.sources?.length > 0 && (
            <div style={{ padding: '10px 14px' }}>
              {item.sources.slice(0, 3).map((s, i) => (
                <div key={i} style={{
                  fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--cyan)',
                  padding: '4px 8px', background: 'var(--cyan-dim)',
                  border: '1px solid rgba(0,212,255,0.15)', borderRadius: 'var(--radius)',
                  marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  ↗ {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Transcript live display ───────────────────────────────────────────────
function TranscriptBox({ chunks, currentChunk }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [chunks, currentChunk]);

  return (
    <div ref={ref} style={{
      height: '160px', overflowY: 'auto',
      padding: '14px 16px',
      background: 'var(--bg0)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      fontFamily: 'var(--mono)', fontSize: '12px', lineHeight: '1.8',
      color: 'var(--muted)',
    }}>
      {chunks.length === 0 && !currentChunk && (
        <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>// transcript will appear here as you speak...</span>
      )}
      {chunks.map((chunk, i) => (
        <span key={i} style={{ color: 'var(--text)' }}>{chunk} </span>
      ))}
      {currentChunk && (
        <span style={{ color: 'var(--a1)' }}>
          {currentChunk}
          <span style={{ animation: 'pulse 0.8s ease infinite', opacity: 1 }}>▌</span>
        </span>
      )}
    </div>
  );
}

// ── Main LiveFactCheck component ──────────────────────────────────────────
export default function LiveFactCheck({ onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | listening | processing | stopped
  const [transcriptChunks, setTranscriptChunks] = useState([]);
  const [currentChunk, setCurrentChunk] = useState('');
  const [claimQueue, setClaimQueue] = useState([]);
  const [verifiedClaims, setVerifiedClaims] = useState([]);
  const [stats, setStats] = useState({ total: 0, true: 0, false: 0, partial: 0, unverifiable: 0 });

  const recognitionRef = useRef(null);
  const chunkBufferRef = useRef('');
  const chunkIntervalRef = useRef(null); // FIX: was chunkTimerRef (setTimeout) — now setInterval
  const statusRef = useRef('idle');     // FIX: mirror status in a ref so rec.onend can read it

  const CHUNK_INTERVAL = 8000; // flush buffer every 8 seconds

  // Keep statusRef in sync with status state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // ── Process a text chunk through the verification pipeline ───────────────
  const processChunk = useCallback(async (text) => {
    if (!text.trim() || text.trim().split(' ').length < 3) return; // FIX: lowered from 5 to 3 words

    const queueId = Date.now();
    setClaimQueue(prev => [...prev, { id: queueId, text: text.slice(0, 80) + '...', status: 'pending' }]);

    try {
      await startVerification(
        { text },
        () => {},
        (report) => {
          const claims = report.claims || report.verified_claims || [];
          const newClaims = claims.map((c, i) => ({
            id: `${queueId}-${i}`,
            claim: c.claim || c.text || '',
            verdict: c.verdict || 'UNVERIFIABLE',
            confidence: c.confidence > 1 ? c.confidence : Math.round((c.confidence || 0) * 100),
            explanation: c.explanation || c.reasoning || '',
            sources: c.sources || c.evidence_urls || [],
            timestamp: Date.now(),
          }));

          newClaims.forEach((claim, i) => {
            setTimeout(() => {
              setVerifiedClaims(prev => [claim, ...prev].slice(0, 50));
              setStats(prev => ({
                total: prev.total + 1,
                true: prev.true + (claim.verdict === 'TRUE' ? 1 : 0),
                false: prev.false + (claim.verdict === 'FALSE' ? 1 : 0),
                partial: prev.partial + (claim.verdict === 'PARTIALLY TRUE' ? 1 : 0),
                unverifiable: prev.unverifiable + (claim.verdict === 'UNVERIFIABLE' ? 1 : 0),
              }));
            }, i * 600 + 500);
          });

          setClaimQueue(prev => prev.filter(q => q.id !== queueId));
        },
        (err) => {
          console.error('[LiveFactCheck] verification error:', err);
          setClaimQueue(prev => prev.filter(q => q.id !== queueId));
        }
      );
    } catch (err) {
      console.error('[LiveFactCheck] process error:', err);
      setClaimQueue(prev => prev.filter(q => q.id !== queueId));
    }
  }, []);

  // ── Flush the accumulated buffer ─────────────────────────────────────────
  const flushBuffer = useCallback(() => {
    const chunk = chunkBufferRef.current.trim();
    if (chunk && chunk.split(' ').length >= 3) {
      setTranscriptChunks(prev => [...prev, chunk]);
      processChunk(chunk);
      chunkBufferRef.current = '';
    }
  }, [processChunk]);

  // ── Speech recognition setup ──────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recognitionRef.current = rec;

    rec.onstart = () => {
      setIsListening(true);
      setStatus('listening');
    };

    rec.onend = () => {
      setIsListening(false);
      // FIX: use statusRef instead of stale status closure
      if (statusRef.current !== 'stopped') {
        try { rec.start(); } catch {}
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('[LiveFactCheck] speech error:', e.error);
    };

    rec.onresult = (e) => {
      let interim = '';
      let final = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }

      setCurrentChunk(interim);

      if (final) {
        // FIX: just accumulate — the fixed interval handles flushing every 8s
        chunkBufferRef.current += ' ' + final;
        setCurrentChunk('');
      }
    };

    rec.start();

    // FIX: use setInterval (fixed cadence) instead of setTimeout (resets on every word)
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    chunkIntervalRef.current = setInterval(flushBuffer, CHUNK_INTERVAL);

  }, [flushBuffer]);

  const stopListening = useCallback(() => {
    setStatus('stopped');
    setIsListening(false);
    recognitionRef.current?.stop();

    // FIX: clearInterval instead of clearTimeout
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    // Process any remaining buffer immediately
    const remaining = chunkBufferRef.current.trim();
    if (remaining) {
      setTranscriptChunks(prev => [...prev, remaining]);
      processChunk(remaining);
      chunkBufferRef.current = '';
    }
    setCurrentChunk('');
  }, [processChunk]);

  const handleToggle = () => {
    if (isListening || status === 'listening') stopListening();
    else startListening();
  };

  const handleClear = () => {
    stopListening();
    setTranscriptChunks([]);
    setCurrentChunk('');
    setClaimQueue([]);
    setVerifiedClaims([]);
    setStats({ total: 0, true: 0, false: 0, partial: 0, unverifiable: 0 });
    chunkBufferRef.current = '';
    setStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    };
  }, []);

  const scoreColor = stats.total === 0 ? 'var(--dim)'
    : (stats.true / stats.total) >= 0.7 ? 'var(--green)'
    : (stats.true / stats.total) >= 0.4 ? 'var(--orange)' : 'var(--red)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,10,15,0.95)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.2s ease both',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px',
        borderBottom: '1px solid var(--line2)',
        background: 'rgba(6,10,15,0.98)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', border: `1px solid ${isListening ? 'var(--red)' : 'var(--line2)'}`, borderRadius: '20px', background: isListening ? 'rgba(255,69,96,0.1)' : 'transparent' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isListening ? 'var(--red)' : 'var(--dim)', boxShadow: isListening ? '0 0 8px var(--red)' : 'none', animation: isListening ? 'pulse 1s ease infinite' : 'none' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: isListening ? 'var(--red)' : 'var(--dim)', letterSpacing: '2px' }}>
              {isListening ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '18px', letterSpacing: '3px', color: 'var(--a1)' }}>LIVE FACT-CHECK</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>REAL-TIME SPEECH VERIFICATION</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleClear} style={{
            padding: '6px 14px', background: 'transparent',
            border: '1px solid var(--line2)', borderRadius: 'var(--radius)',
            color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.color = 'var(--orange)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
          >↺ CLEAR</button>
          <button onClick={onClose} style={{
            padding: '6px 14px', background: 'transparent',
            border: '1px solid var(--line2)', borderRadius: 'var(--radius)',
            color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
          >✕ CLOSE</button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', overflow: 'hidden' }}>

        {/* LEFT — transcript + controls ── */}
        <div style={{ padding: '24px', borderRight: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>

          {/* Big mic button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
            <button
              onClick={handleToggle}
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: isListening ? 'rgba(255,69,96,0.15)' : 'var(--a1-dim)',
                border: `2px solid ${isListening ? 'var(--red)' : 'var(--a1)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px',
                boxShadow: isListening
                  ? '0 0 0 8px rgba(255,69,96,0.1), 0 0 40px rgba(255,69,96,0.2)'
                  : '0 0 20px var(--a1-glow)',
                animation: isListening ? 'border-glow 1.5s ease infinite' : 'none',
              }}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: '20px', letterSpacing: '3px', color: isListening ? 'var(--red)' : 'var(--a1)' }}>
                {isListening ? 'LISTENING...' : status === 'stopped' ? 'PAUSED' : 'CLICK TO START'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', marginTop: '4px', letterSpacing: '1px' }}>
                {isListening ? 'Claims verified every ~8 seconds' : 'Speak clearly into your microphone'}
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>
              LIVE TRANSCRIPT
            </div>
            <TranscriptBox chunks={transcriptChunks} currentChunk={currentChunk} />
          </div>

          {/* Processing queue */}
          {claimQueue.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '8px' }}>
                VERIFYING ({claimQueue.length} IN QUEUE)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {claimQueue.map(q => (
                  <div key={q.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', background: 'var(--bg2)',
                    border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                  }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div style={{
            marginTop: 'auto', padding: '14px 16px',
            border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg1)',
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
          }}>
            {[
              { label: 'TOTAL', val: stats.total, color: 'var(--a1)' },
              { label: 'TRUE', val: stats.true, color: 'var(--green)' },
              { label: 'FALSE', val: stats.false, color: 'var(--red)' },
              { label: 'PARTIAL', val: stats.partial, color: 'var(--orange)' },
              { label: 'N/A', val: stats.unverifiable, color: 'var(--dim)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: '24px', color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)', letterSpacing: '1px', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — verified claims feed ── */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '3px', height: '16px', background: 'var(--a1)' }} />
              <span style={{ fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--a1)' }}>VERIFIED CLAIMS</span>
            </div>
            {stats.total > 0 && (
              <div style={{ fontFamily: 'var(--display)', fontSize: '20px', color: scoreColor }}>
                {Math.round((stats.true / stats.total) * 100)}%
              </div>
            )}
          </div>

          {verifiedClaims.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--line2)', borderRadius: 'var(--radius-lg)',
              padding: '40px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.3 }}>⚖</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '1px', lineHeight: '1.8' }}>
                VERIFIED CLAIMS WILL<br />APPEAR HERE WITH A<br />5–10 SECOND DELAY
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {verifiedClaims.map((claim, i) => (
                <LiveClaimCard key={claim.id} item={claim} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}