import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import Background from './components/Background';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import Pipeline from './components/Pipeline';
import ClaimCard from './components/ClaimCard';
import SummaryReport from './components/SummaryReport';
import BiasPanel from './components/BiasPanel';
import HistoryPanel from './components/HistoryPanel';
import ClaimHighlight from './components/ClaimHighlight';
import { useAuth, useUser } from '@clerk/clerk-react';
import AuthPage from './components/AuthPage';
import { analyzeAll, analyzeAIOnly } from './services/api';
import { downloadReport } from './services/downloadReport';
import { saveAnalysis, getHistory } from './services/history';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function SectionLabel({ color = 'var(--a1)', children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ width: '3px', height: '18px', background: color }} />
      <span style={{ fontFamily: 'var(--display)', fontSize: '15px', letterSpacing: '2.5px', color }}>{children}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ border: '1px dashed var(--line2)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', letterSpacing: '1px' }}>
      <div style={{ fontSize: '24px', marginBottom: '12px', opacity: 0.4 }}>◈</div>
      {message}
    </div>
  );
}

<<<<<<< HEAD
// AI Detection full result panel
=======
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
function AIDetectionResult({ result }) {
  if (!result) return null;
  const isAI = result.verdict === 'LIKELY AI';
  const isHuman = result.verdict === 'LIKELY HUMAN';
  const color = isAI ? 'var(--red)' : isHuman ? 'var(--green)' : 'var(--orange)';
  const bgColor = isAI ? 'var(--red-dim)' : isHuman ? 'var(--green-dim)' : 'var(--orange-dim)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeUp 0.4s ease both' }}>
<<<<<<< HEAD
      <div style={{ border: `1px solid ${color}`, borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-lg)', background: bgColor, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'center', minWidth: '90px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: '56px', color, lineHeight: 1 }}>{result.aiScore}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color, letterSpacing: '2px', marginTop: '2px' }}>% AI SCORE</div>
        </div>
        <div style={{ width: '1px', height: '60px', background: `${color}44` }} />
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '32px', color, letterSpacing: '3px' }}>{result.verdict}</div>
=======
      {/* big verdict */}
      <div style={{
        border: `1px solid ${color}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        background: bgColor,
        padding: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(40px,8vw,56px)', color, lineHeight: 1 }}>
            {result.aiScore}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color, letterSpacing: '2px', marginTop: '2px' }}>
            % AI SCORE
          </div>
        </div>
        <div style={{ width: '1px', height: '60px', background: `${color}44`, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px,4vw,32px)', color, letterSpacing: '3px' }}>
            {result.verdict}
          </div>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            {isAI ? 'High probability of AI-generated content detected.' : isHuman ? 'Text exhibits strong human writing characteristics.' : 'Mixed signals — cannot determine authorship with confidence.'}
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>AUTHORSHIP SCORES</div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[{ label: 'AI-GENERATED', value: result.aiScore, color: 'var(--red)' }, { label: 'HUMAN-WRITTEN', value: result.humanScore, color: 'var(--green)' }].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '10px', color: s.color, marginBottom: '6px', letterSpacing: '1px' }}>
                <span>{s.label}</span><span>{s.value}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: '3px', boxShadow: `0 0 8px ${s.color}`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.signals?.length > 0 && (
        <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>DETECTED SIGNALS</div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.signals.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                <span style={{ color, fontFamily: 'var(--mono)', fontSize: '12px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { isSignedIn, isLoaded } = useAuth();
<<<<<<< HEAD
  const { user } = useUser();
  // Use a stable userId — always 'guest' until Clerk confirms identity
  const userId = user?.id || 'guest';

  const [showLanding, setShowLanding] = useState(true);

  // Auto-skip landing if already signed in
=======
  const [showLanding, setShowLanding] = useState(true);

>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
  useEffect(() => {
    if (isLoaded && isSignedIn) setShowLanding(false);
  }, [isLoaded, isSignedIn]);

  // Core analysis state
  const [phase, setPhase] = useState('idle');
  const [analysisMode, setAnalysisMode] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [claims, setClaims] = useState([]);
  const [results, setResults] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [aiDetection, setAiDetection] = useState(null);
  const [biasData, setBiasData] = useState(null);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');

  // History state — use a ref so refreshHistory always uses latest userId
  const [history, setHistory] = useState([]);
  const userIdRef = React.useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const refreshHistory = useCallback(() => {
    const id = userIdRef.current;
    const data = getHistory(id);
    setHistory(data);
  }, []);

  // Load history whenever userId changes (after Clerk loads)
  useEffect(() => { refreshHistory(); }, [userId, refreshHistory]);

  // Responsive: track viewport width
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;
  const isDesktop = vw >= 1024;

  const handleAnalyze = async ({ mode, content }) => {
    try {
      setPhase('running'); setAnalysisMode(mode); setError(null);
      setClaims([]); setResults([]); setVerifiedCount(0);
      setAiDetection(null); setBiasData(null); setInputText(content);

      if (mode === 'factcheck') {
        setPipelineStep('extract'); await sleep(600);
        setPipelineStep('search');  await sleep(600);
        setPipelineStep('verify');

        // Single API call — extract + verify + AI detection + bias all at once
        const analysis = await analyzeAll(content);
        const combined = analysis.claims;

        // Feed claims in one by one for animated reveal
        const claimsOnly = combined.map(({ id, claim, context }) => ({ id, claim, context }));
        setClaims(claimsOnly);
        for (let i = 0; i < combined.length; i++) {
          const { verdict, confidence, explanation, sources, searchQuery, conflicting, timeSensitive, difficulty } = combined[i];
          setResults(prev => [...prev, { verdict, confidence, explanation, sources, searchQuery, conflicting, timeSensitive, difficulty }]);
          setVerifiedCount(i + 1);
          await sleep(350);
        }

        setPipelineStep('report');
<<<<<<< HEAD
        setAiDetection(analysis.aiDetection);
        setBiasData(analysis.bias);

        // Save to history
        const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
        combined.forEach(c => { if (verdicts[c.verdict] !== undefined) verdicts[c.verdict]++; });
        const accuracyScore = Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / combined.length) * 100);
        saveAnalysis(userIdRef.current, {
          mode: 'factcheck',
          snippet: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
          accuracyScore,
          verdicts,
          claimCount: combined.length,
        });
        refreshHistory();

      } else {
        // AI detection mode — single API call for AI detection + bias
        setPipelineStep('extract'); await sleep(500);
=======
        const aiResult = await detectAIContent(content);
        setAiDetection(aiResult);
      } else {
        setPipelineStep('extract');
        await sleep(500);
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
        setPipelineStep('verify');
        const analysis = await analyzeAIOnly(content);
        setAiDetection(analysis.aiDetection);
        setBiasData(analysis.bias);
        setPipelineStep('report');

        saveAnalysis(userIdRef.current, {
          mode: 'aidetect',
          snippet: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
          aiScore: analysis.aiDetection.aiScore,
          verdict: analysis.aiDetection.verdict,
        });
        refreshHistory();
      }

      setPhase('done');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleReset = () => {
    setPhase('idle'); setAnalysisMode(null); setPipelineStep(null);
    setClaims([]); setResults([]); setVerifiedCount(0);
    setAiDetection(null); setBiasData(null); setError(null); setInputText('');
  };

  const handleRestoreHistory = (entry) => {
    // Just show the snippet info — full restore would need stored results
    setInputText(entry.snippet);
    setPhase('idle');
  };

  const isLoading = phase === 'running';

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} isSignedIn={isSignedIn} />;
  if (!isSignedIn) return <AuthPage />;

  // Dashboard layout config
  const dashboardGrid = isDesktop
    ? '220px 1fr 250px'
    : isTablet
      ? '1fr'
      : '1fr';

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />
      <Header onBackToLanding={() => setShowLanding(true)} />

<<<<<<< HEAD
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1380px', margin: '0 auto', padding: '32px 28px 80px' }}>
=======
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1280px', margin: '0 auto',
        padding: isMobile ? '16px 14px 60px' : isTablet ? '24px 20px 80px' : '32px 28px 80px',
      }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3

        {/* HERO */}
        {phase === 'idle' && (
          <div style={{ marginBottom: '28px', animation: 'fadeUp 0.5s ease both' }}>
            <div style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px', marginBottom: '20px',
            }}>
              <div>
<<<<<<< HEAD
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '10px' }}>// INTELLIGENCE VERIFICATION PLATFORM</div>
                <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(48px,7vw,90px)', letterSpacing: '4px', lineHeight: 0.9, color: 'var(--text)' }}>
=======
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '10px' }}>
                  // INTELLIGENCE VERIFICATION PLATFORM
                </div>
                <h1 style={{
                  fontFamily: 'var(--display)',
                  fontSize: isMobile ? 'clamp(42px,12vw,64px)' : 'clamp(48px,7vw,90px)',
                  letterSpacing: '4px', lineHeight: 0.9, color: 'var(--text)',
                }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
                  FACT<br />
                  <span style={{ color: 'var(--a1)' }}>CHECK</span>
                  <span style={{ fontSize: isMobile ? 'clamp(18px,5vw,28px)' : 'clamp(24px,3.5vw,44px)', color: 'var(--dim)', marginLeft: '12px', letterSpacing: '2px' }}>ENGINE</span>
                </h1>
              </div>
<<<<<<< HEAD
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '380px' }}>
=======

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                width: isMobile ? '100%' : '340px',
                maxWidth: isMobile ? '100%' : '340px',
              }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
                {[
                  { label: 'FACT CHECK', val: 'CLAIMS', color: 'var(--a1)' },
                  { label: 'AI DETECTION', val: 'AUTHORSHIP', color: 'var(--cyan)' },
                  { label: 'BIAS ANALYSIS', val: 'FRAMING', color: '#a78bfa' },
                  { label: 'STATUS', val: 'ONLINE', color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px 14px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg1)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)', letterSpacing: '1.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '16px', color: s.color, letterSpacing: '2px' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: '1px', background: 'var(--line2)', marginBottom: '24px' }} />
          </div>
        )}

        {/* STATUS BAR */}
        {phase !== 'idle' && (
<<<<<<< HEAD
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', marginBottom: '24px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
=======
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '10px',
            padding: isMobile ? '8px 12px' : '10px 16px', marginBottom: '20px',
            border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
              {isLoading
                ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                : <span style={{ color: 'var(--green)' }}>✓</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: isLoading ? 'var(--a1)' : 'var(--green)', letterSpacing: '1px' }}>
                {isLoading ? 'ANALYSIS IN PROGRESS...' : 'ANALYSIS COMPLETE'}
              </span>
              {analysisMode && (
<<<<<<< HEAD
                <div style={{ padding: '2px 10px', border: `1px solid ${analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)'}`, borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px', color: analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)', letterSpacing: '1px' }}>
                  {analysisMode === 'factcheck' ? 'FACT CHECK MODE' : 'AI DETECTION MODE'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Download report button — only when done */}
              {phase === 'done' && (
                <button
                  onClick={() => downloadReport({ claims, results, aiDetection, bias: biasData, inputText, mode: analysisMode })}
                  style={{
                    padding: '6px 16px', background: 'transparent',
                    border: '1px solid rgba(0,212,255,0.4)',
                    borderRadius: 'var(--radius)', color: 'var(--cyan)',
                    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  ↓ DOWNLOAD REPORT
                </button>
              )}
              <button onClick={handleReset} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.color = 'var(--a1)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
              >↩ NEW ANALYSIS</button>
            </div>
=======
                <div style={{
                  padding: '2px 10px', border: `1px solid ${analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)'}`,
                  borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px',
                  color: analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)', letterSpacing: '1px',
                }}>
                  {analysisMode === 'factcheck' ? 'FACT CHECK' : 'AI DETECT'}
                </div>
              )}
            </div>
            <button onClick={handleReset} style={{
              padding: '6px 14px', background: 'transparent', border: '1px solid var(--line2)',
              borderRadius: 'var(--radius)', color: 'var(--dim)', fontFamily: 'var(--mono)',
              fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.color = 'var(--a1)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
            >↩ NEW</button>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div style={{ padding: '12px 16px', marginBottom: '20px', border: '1px solid rgba(255,69,96,0.4)', borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius)', background: 'var(--red-dim)', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {/* IDLE — Input + History */}
        {(phase === 'idle' || phase === 'error') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
            <InputPanel onAnalyze={handleAnalyze} loading={isLoading} />
            <div style={{ position: 'sticky', top: '20px' }}>
              <SectionLabel color="var(--cyan)">HISTORY</SectionLabel>
              <HistoryPanel
                history={history}
                userId={userId}
                onRestore={handleRestoreHistory}
                onHistoryChange={refreshHistory}
              />
            </div>
          </div>
        )}

        {/* RUNNING / DONE — Dashboard */}
        {(phase === 'running' || phase === 'done') && (
<<<<<<< HEAD
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '20px', alignItems: 'start' }}>

            {/* LEFT — pipeline + history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
              <SectionLabel color="var(--cyan)">PIPELINE</SectionLabel>
              <Pipeline currentStep={phase === 'done' ? 'report' : pipelineStep} claimCount={claims.length} verifiedCount={verifiedCount} />

              {/* Claim index */}
              {analysisMode === 'factcheck' && claims.length > 0 && (
=======
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '220px 1fr 250px' : '1fr',
            gap: isMobile ? '16px' : '20px',
            alignItems: 'start',
          }}>

            {/* LEFT — pipeline (shown first on mobile in a horizontal-scroll or full-width) */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '12px',
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? '20px' : 'auto',
              order: isMobile ? 1 : 0,
            }}>
              {!isMobile && <SectionLabel color="var(--cyan)">PIPELINE</SectionLabel>}

              {/* On mobile, show pipeline as a compact horizontal stepper */}
              {isMobile ? (
                <MobilePipelineStepper currentStep={phase === 'done' ? 'report' : pipelineStep} claimCount={claims.length} verifiedCount={verifiedCount} />
              ) : (
                <Pipeline currentStep={phase === 'done' ? 'report' : pipelineStep} claimCount={claims.length} verifiedCount={verifiedCount} />
              )}

              {/* claim index — hide on mobile */}
              {!isMobile && analysisMode === 'factcheck' && claims.length > 0 && (
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
                <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>CLAIM INDEX</div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {claims.map((c, i) => {
                      const r = results[i];
                      const dotColor = !r ? 'var(--dim)' : r.verdict === 'TRUE' ? 'var(--green)' : r.verdict === 'FALSE' ? 'var(--red)' : r.verdict === 'PARTIALLY TRUE' ? 'var(--orange)' : 'var(--muted)';
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: r ? `0 0 4px ${dotColor}` : 'none', animation: !r && isLoading ? 'pulse 1s ease infinite' : 'none' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                            {c.claim.slice(0, 38)}{c.claim.length > 38 ? '…' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History panel in sidebar */}
              {history.length > 0 && (
                <>
                  <SectionLabel color="var(--cyan)">HISTORY</SectionLabel>
                  <HistoryPanel history={history} userId={userId} onRestore={handleRestoreHistory} onHistoryChange={refreshHistory} />
                </>
              )}
            </div>

<<<<<<< HEAD
            {/* CENTER — claims / ai detection + claim highlight */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
=======
            {/* CENTER — results */}
            <div style={{ order: isMobile ? 2 : 0, minWidth: 0 }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
              {analysisMode === 'factcheck' ? (
                <>
                  <SectionLabel>EXTRACTED CLAIMS</SectionLabel>
                  {claims.length === 0 ? (
                    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', letterSpacing: '1px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                      PROCESSING...
                    </div>
                  ) : (
                    <>
                      {claims.map((claim, i) => (
                        <ClaimCard key={claim.id} claim={claim} result={results[i]} index={i} loading={isLoading && !results[i]} />
                      ))}
                      {/* Claim highlight overlay — shows after all results in */}
                      {phase === 'done' && results.length === claims.length && (
                        <ClaimHighlight text={inputText} claims={claims} results={results} />
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <SectionLabel color="var(--cyan)">AI DETECTION RESULT</SectionLabel>
                  {phase === 'done'
                    ? <AIDetectionResult result={aiDetection} />
                    : (
                      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', letterSpacing: '1px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                        ANALYZING AUTHORSHIP...
                      </div>
                    )}
                </>
              )}
            </div>

<<<<<<< HEAD
            {/* RIGHT — report + bias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
=======
            {/* RIGHT — summary report */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '16px',
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? '20px' : 'auto',
              order: isMobile ? 3 : 0,
            }}>
>>>>>>> 2f8e41887e9d551b8e07df2504c9d0edd2f213e3
              {analysisMode === 'factcheck' && (
                <>
                  <SectionLabel color="var(--a1)">REPORT</SectionLabel>
                  {phase === 'done'
                    ? <SummaryReport claims={claims} results={results} aiDetection={aiDetection} />
                    : <EmptyState message="REPORT GENERATES AFTER VERIFICATION" />}
                  {phase === 'done' && biasData && (
                    <>
                      <SectionLabel color="#a78bfa">BIAS</SectionLabel>
                      <BiasPanel bias={biasData} />
                    </>
                  )}
                </>
              )}
              {analysisMode === 'aidetect' && phase === 'done' && (
                <>
                  <SectionLabel color="var(--cyan)">SUMMARY</SectionLabel>
                  <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>QUICK STATS</div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: 'AI PROBABILITY', val: `${aiDetection?.aiScore}%`, color: 'var(--red)' },
                        { label: 'HUMAN PROBABILITY', val: `${aiDetection?.humanScore}%`, color: 'var(--green)' },
                        { label: 'VERDICT', val: aiDetection?.verdict, color: aiDetection?.verdict === 'LIKELY AI' ? 'var(--red)' : aiDetection?.verdict === 'LIKELY HUMAN' ? 'var(--green)' : 'var(--orange)' },
                        { label: 'SIGNALS FOUND', val: `${aiDetection?.signals?.length || 0}`, color: 'var(--cyan)' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>{s.label}</span>
                          <span style={{ fontFamily: 'var(--display)', fontSize: '14px', color: s.color, letterSpacing: '1px' }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {biasData && (
                    <>
                      <SectionLabel color="#a78bfa">BIAS</SectionLabel>
                      <BiasPanel bias={biasData} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Compact mobile pipeline stepper ──────────────────────────────────────
const STEP_LABELS = ['EXTRACT', 'SEARCH', 'VERIFY', 'REPORT'];
const STEP_IDS = ['extract', 'search', 'verify', 'report'];

function MobilePipelineStepper({ currentStep, claimCount, verifiedCount }) {
  const currentIdx = STEP_IDS.indexOf(currentStep);
  const allDone = currentStep === 'report';

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--bg1)', border: '1px solid var(--line2)',
      borderRadius: 'var(--radius-lg)', padding: '12px 14px',
      gap: '4px', overflow: 'hidden',
    }}>
      {STEP_IDS.map((id, i) => {
        const done = allDone || i < currentIdx;
        const active = !allDone && i === currentIdx;
        const color = done ? 'var(--green)' : active ? 'var(--a1)' : 'var(--bg3)';
        return (
          <React.Fragment key={id}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              flex: active ? 2 : 1, transition: 'flex 0.3s ease',
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                border: `1.5px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(240,180,41,0.1)' : done ? 'rgba(0,232,135,0.08)' : 'transparent',
                flexShrink: 0,
              }}>
                {done
                  ? <span style={{ color: 'var(--green)', fontSize: '10px' }}>✓</span>
                  : active
                    ? <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    : <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                {active && id === 'verify' && claimCount > 0
                  ? `${verifiedCount}/${claimCount}`
                  : STEP_LABELS[i]}
              </span>
            </div>
            {i < STEP_IDS.length - 1 && (
              <div style={{
                height: '1px', flex: 1,
                background: i < currentIdx ? 'var(--green)' : 'var(--line)',
                transition: 'background 0.5s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}