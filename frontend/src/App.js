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
import { startVerification, checkAIText, checkAIImage } from './services/api';
import LiveFactCheck from './components/LiveFactCheck';
import { downloadReport } from './services/downloadReport';
import { saveAnalysis, getHistory } from './services/history';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Normalize confidence: backend may send 0–1 or 0–100
function normalizeConf(val) {
  if (val === undefined || val === null) return 0;
  return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

// Map any backend step name to our 4 pipeline steps
function mapStep(step) {
  if (!step) return null;
  const s = step.toLowerCase();
  if (s.includes('extract') || s.includes('claim'))   return 'extract';
  if (s.includes('search') || s.includes('evidence') || s.includes('retriev')) return 'search';
  if (s.includes('verif') || s.includes('check'))     return 'verify';
  if (s.includes('report') || s.includes('generat') || s.includes('compil')) return 'report';
  return null;
}

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

function AIDetectionResult({ result }) {
  if (!result) return null;
  const isAI = result.verdict === 'LIKELY AI';
  const isHuman = result.verdict === 'LIKELY HUMAN';
  const color = isAI ? 'var(--red)' : isHuman ? 'var(--green)' : 'var(--orange)';
  const bgColor = isAI ? 'var(--red-dim)' : isHuman ? 'var(--green-dim)' : 'var(--orange-dim)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ border: `1px solid ${color}`, borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-lg)', background: bgColor, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'center', minWidth: '90px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: '56px', color, lineHeight: 1 }}>{result.aiScore}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color, letterSpacing: '2px', marginTop: '2px' }}>% AI SCORE</div>
        </div>
        <div style={{ width: '1px', height: '60px', background: `${color}44` }} />
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '32px', color, letterSpacing: '3px' }}>{result.verdict}</div>
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
                <span style={{ color, fontFamily: 'var(--mono)', fontSize: '12px', flexShrink: 0 }}>{String(i + 1).padStart(2, '00')}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageAIResult({ result, previewUrl }) {
  if (!result) return null;
  const isAI = result.verdict?.includes('AI');
  const isReal = result.verdict?.includes('REAL');
  const color = isAI ? 'var(--red)' : isReal ? 'var(--green)' : 'var(--orange)';
  const bg = isAI ? 'var(--red-dim)' : isReal ? 'var(--green-dim)' : 'var(--orange-dim)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeUp 0.4s ease both' }}>
      {previewUrl && (
        <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg1)' }}>
          <div style={{ padding: '8px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>ANALYZED IMAGE</div>
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
            <img src={previewUrl} alt="Analyzed" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius)', border: `1px solid ${color}44` }} />
          </div>
        </div>
      )}
      <div style={{ padding: '20px 24px', border: `1px solid ${color}`, borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-lg)', background: bg, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: '48px', color, lineHeight: 1 }}>{result.aiScore}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color, letterSpacing: '2px', marginTop: '2px' }}>% AI SCORE</div>
        </div>
        <div style={{ width: '1px', height: '50px', background: `${color}44` }} />
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: '22px', color, letterSpacing: '2px', marginBottom: '4px' }}>{result.verdict}</div>
          {result.tool && result.tool !== 'UNKNOWN' && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>
              Suspected tool: <span style={{ color }}>{result.tool}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>CONFIDENCE SCORES</div>
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[{ label: 'AI-GENERATED', value: result.aiScore, color: 'var(--red)' }, { label: 'AUTHENTIC', value: result.humanScore, color: 'var(--green)' }].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '10px', color: s.color, marginBottom: '5px', letterSpacing: '1px' }}>
                <span>{s.label}</span><span>{s.value}%</span>
              </div>
              <div style={{ height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: '3px', boxShadow: `0 0 8px ${s.color}`, transition: 'width 1.2s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {result.summary && (
        <div style={{ padding: '12px 14px', background: 'var(--bg1)', border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.7' }}>
          {result.summary}
        </div>
      )}
      {result.signals?.length > 0 && (
        <div style={{ border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg1)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' }}>DETECTED SIGNALS</div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.signals.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>
                <span style={{ color, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>{s}
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
  const { user } = useUser();
  const userId = user?.id || 'guest';

  const [showLanding, setShowLanding] = useState(true);
  useEffect(() => {
    if (isLoaded && isSignedIn) setShowLanding(false);
  }, [isLoaded, isSignedIn]);

  const [phase, setPhase] = useState('idle');
  const [analysisMode, setAnalysisMode] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [claims, setClaims] = useState([]);
  const [results, setResults] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [aiDetection, setAiDetection] = useState(null);
  const [biasData, setBiasData] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');

  const [history, setHistory] = useState([]);
  const userIdRef = React.useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const refreshHistory = useCallback(async () => {
    const data = await getHistory(userIdRef.current);
    setHistory(data);
  }, []);

  useEffect(() => { refreshHistory(); }, [userId, refreshHistory]);

  const handleAnalyze = async (data) => {
    const { mode, content, imageName, imageFile } = data;
    const abortController = new AbortController();

    try {
      setPhase('running'); setAnalysisMode(mode); setError(null);
      setClaims([]); setResults([]); setVerifiedCount(0);
      setAiDetection(null); setBiasData(null);
      setImageResult(null); setImagePreviewUrl(null);
      setInputText(content || '');
      setPipelineStep('extract');

      // ── IMAGE AI DETECTION ────────────────────────────────────────────
      if (imageFile && mode === 'aidetect') {
        setPipelineStep('extract'); await sleep(400);
        setPipelineStep('verify');
        const imgResult = await checkAIImage(imageFile);
        setImageResult({
          aiScore: imgResult.aiDetection.aiScore,
          humanScore: imgResult.aiDetection.humanScore,
          verdict: imgResult.aiDetection.verdict === 'LIKELY AI' ? 'LIKELY AI GENERATED'
            : imgResult.aiDetection.verdict === 'LIKELY HUMAN' ? 'LIKELY REAL' : 'UNCERTAIN',
          tool: 'SightEngine',
          signals: imgResult.aiDetection.signals || [],
          summary: `AI probability: ${imgResult.aiDetection.aiScore}%. ${imgResult.aiDetection.verdict}.`,
        });
        setImagePreviewUrl(URL.createObjectURL(imageFile));
        setPipelineStep('report');
        saveAnalysis(userIdRef.current, {
          mode: 'aidetect',
          snippet: `[IMAGE] ${imageName || 'uploaded image'}`,
          aiScore: imgResult.aiDetection.aiScore,
          verdict: imgResult.aiDetection.verdict,
        });
        refreshHistory();
        setPhase('done');
        return;
      }

      // ── TEXT AI DETECTION ─────────────────────────────────────────────
      if (mode === 'aidetect') {
        setPipelineStep('extract'); await sleep(500);
        setPipelineStep('verify');
        const analysis = await checkAIText(content);
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
        setPhase('done');
        return;
      }

      // ── FACT CHECK — SSE stream ───────────────────────────────────────
      if (mode === 'factcheck') {
        await startVerification(
          { text: content },

          // ── onProgress ──────────────────────────────────────────────
          (stepData) => {
            // Map any backend step name to our pipeline
            const mapped = mapStep(stepData.step);
            if (mapped) setPipelineStep(mapped);

            // Partial claims (array of strings or objects)
            if (stepData.data?.claims) {
              const partial = stepData.data.claims;
              setClaims(partial.map((c, i) => ({
                id: i + 1,
                claim: c.claim || c.text || (typeof c === 'string' ? c : ''),
                context: c.context || '',
              })));
            }

            // Partial verified claims streamed mid-pipeline
            if (stepData.data?.verified_claims || stepData.data?.verdicts) {
              const vcs = stepData.data.verified_claims || stepData.data.verdicts || [];
              const mapped = vcs.map(c => ({
                verdict:     c.verdict     || 'UNVERIFIABLE',
                confidence:  normalizeConf(c.confidence ?? c.confidence_score),
                explanation: c.explanation || c.reasoning || '',
                sources:     c.sources     || c.cited_sources || c.evidence_urls || [],
                searchQuery: c.search_query || c.searchQuery || '',
                conflicting: c.conflicting || false,
                timeSensitive: c.time_sensitive || false,
                difficulty:  c.difficulty  || 'MEDIUM',
                tavilyAnswer: c.tavily_answer || '',
              }));
              setResults(mapped);
              setVerifiedCount(mapped.length);
            }
          },

          // ── onComplete ───────────────────────────────────────────────
          (report) => {
            // api.js already merges claims+verdicts into report.claims
            const rawClaims = report.claims || report.verified_claims || [];

            const claimsOnly = rawClaims.map((c, i) => ({
              id: c.id || i + 1,
              claim: c.claim || c.text || (typeof c === 'string' ? c : ''),
              context: c.context || '',
            }));

            const resultsMap = rawClaims.map(c => ({
              verdict:     c.verdict     || 'UNVERIFIABLE',
              confidence:  normalizeConf(c.confidence ?? c.confidence_score),
              explanation: c.explanation || c.reasoning || '',
              sources:     c.sources     || c.cited_sources || c.evidence_urls || [],
              searchQuery: c.search_query || c.searchQuery || '',
              conflicting: c.conflicting || false,
              timeSensitive: c.time_sensitive || false,
              difficulty:  c.difficulty  || 'MEDIUM',
              tavilyAnswer: c.tavily_answer || '',
            }));

            setClaims(claimsOnly);
            setResults(resultsMap);
            setVerifiedCount(resultsMap.length);
            setPipelineStep('report');

            // AI detection from report
            if (report.ai_detection) {
              setAiDetection({
                aiScore:    normalizeConf(report.ai_detection.ai_probability),
                humanScore: 100 - normalizeConf(report.ai_detection.ai_probability),
                verdict:    report.ai_detection.verdict || 'UNCERTAIN',
                signals:    report.ai_detection.signals || [],
              });
            }
            if (report.bias) setBiasData(report.bias);

            // Save to history
            const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
            resultsMap.forEach(r => { if (verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
            const accuracyScore = resultsMap.length > 0
              ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / resultsMap.length) * 100) : 0;
            saveAnalysis(userIdRef.current, {
              mode: 'factcheck',
              snippet: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
              accuracyScore, verdicts, claimCount: resultsMap.length,
            });
            refreshHistory();
            setPhase('done');
          },

          // ── onError ──────────────────────────────────────────────────
          (errMsg) => {
            setError(errMsg);
            setPhase('error');
          },

          abortController.signal
        );
      }

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleShare = async () => {
    const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
    results.forEach(r => { if (r && verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
    const total = results.filter(Boolean).length;
    const score = total > 0 ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
    const shareText = analysisMode === 'factcheck'
      ? `🔍 CredenceAI Fact Check Report\n\nAccuracy Score: ${score}%\n✓ TRUE: ${verdicts.TRUE} · ◐ PARTIAL: ${verdicts['PARTIALLY TRUE']} · ✗ FALSE: ${verdicts.FALSE}\n\nVerified with real-time Tavily web search + Gemini AI\n\n#CredenceAI #FactCheck`
      : `🤖 CredenceAI AI Detection Report\n\nAI Score: ${aiDetection?.aiScore || 0}%\nVerdict: ${aiDetection?.verdict || 'UNCERTAIN'}\n\nAnalyzed with Gemini AI\n\n#CredenceAI #AIDetection`;
    setShowShareModal(true);
    if (navigator.share) {
      try { await navigator.share({ title: 'CredenceAI Report', text: shareText }); setShowShareModal(false); return; } catch {}
    }
  };

  const copyShareText = () => {
    const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
    results.forEach(r => { if (r && verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
    const total = results.filter(Boolean).length;
    const score = total > 0 ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
    const text = analysisMode === 'factcheck'
      ? `🔍 CredenceAI Fact Check Report\n\nAccuracy Score: ${score}%\n✓ TRUE: ${verdicts.TRUE} · ◐ PARTIAL: ${verdicts['PARTIALLY TRUE']} · ✗ FALSE: ${verdicts.FALSE}\n\nVerified with Tavily + Gemini AI\n#CredenceAI #FactCheck`
      : `🤖 CredenceAI AI Detection\n\nAI Score: ${aiDetection?.aiScore || 0}%\nVerdict: ${aiDetection?.verdict || 'UNCERTAIN'}\n#CredenceAI #AIDetection`;
    navigator.clipboard.writeText(text).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setPhase('idle'); setAnalysisMode(null); setPipelineStep(null);
    setClaims([]); setResults([]); setVerifiedCount(0);
    setAiDetection(null); setBiasData(null); setImageResult(null);
    setImagePreviewUrl(null); setError(null); setInputText('');
  };

  const handleRestoreHistory = (entry) => {
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

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />
      <Header onBackToLanding={() => setShowLanding(true)} onLive={() => setShowLive(true)} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1380px', margin: '0 auto', padding: '32px 28px 80px' }}>

        {/* HERO */}
        {phase === 'idle' && (
          <div style={{ marginBottom: '36px', animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '10px' }}>// INTELLIGENCE VERIFICATION PLATFORM</div>
                <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(48px,7vw,90px)', letterSpacing: '4px', lineHeight: 0.9, color: 'var(--text)' }}>
                  FACT<br />
                  <span style={{ color: 'var(--a1)' }}>CHECK</span>
                  <span style={{ fontSize: 'clamp(24px,3.5vw,44px)', color: 'var(--dim)', marginLeft: '16px', letterSpacing: '2px' }}>ENGINE</span>
                </h1>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '380px' }}>
                {[
                  { label: 'FACT CHECK', val: 'CLAIMS', color: 'var(--a1)' },
                  { label: 'AI DETECTION', val: 'AUTHORSHIP', color: 'var(--cyan)' },
                  { label: 'BIAS ANALYSIS', val: 'FRAMING', color: '#a78bfa' },
                  { label: 'STATUS', val: 'ONLINE', color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px 14px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg1)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)', letterSpacing: '1.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '18px', color: s.color, letterSpacing: '2px' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: '1px', background: 'var(--line2)', marginBottom: '28px' }} />
          </div>
        )}

        {/* STATUS BAR */}
        {phase !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', marginBottom: '24px', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', background: 'var(--bg1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isLoading
                ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--a1)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                : <span style={{ color: 'var(--green)' }}>✓</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: isLoading ? 'var(--a1)' : 'var(--green)', letterSpacing: '1px' }}>
                {isLoading ? 'ANALYSIS IN PROGRESS...' : 'ANALYSIS COMPLETE'}
              </span>
              {analysisMode && (
                <div style={{ padding: '2px 10px', border: `1px solid ${analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)'}`, borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '9px', color: analysisMode === 'factcheck' ? 'var(--a1)' : 'var(--cyan)', letterSpacing: '1px' }}>
                  {analysisMode === 'factcheck' ? 'FACT CHECK MODE' : 'AI DETECTION MODE'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {phase === 'done' && (
                <>
                  <button
                    onClick={() => downloadReport({ claims, results, aiDetection, bias: biasData, inputText, mode: analysisMode })}
                    style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(0,212,255,0.4)', borderRadius: 'var(--radius)', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >↓ DOWNLOAD</button>
                  <button
                    onClick={handleShare}
                    style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(0,232,135,0.4)', borderRadius: 'var(--radius)', color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,232,135,0.08)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,232,135,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >⬡ SHARE</button>
                </>
              )}
              <button onClick={handleReset}
                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--line2)', borderRadius: 'var(--radius)', color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.color = 'var(--a1)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--line2)'; e.target.style.color = 'var(--dim)'; }}
              >↩ NEW</button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div style={{ padding: '12px 16px', marginBottom: '20px', border: '1px solid rgba(255,69,96,0.4)', borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius)', background: 'var(--red-dim)', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {/* IDLE */}
        {(phase === 'idle' || phase === 'error') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
            <InputPanel onAnalyze={handleAnalyze} loading={isLoading} />
            <div style={{ position: 'sticky', top: '20px' }}>
              <SectionLabel color="var(--cyan)">HISTORY</SectionLabel>
              <HistoryPanel history={history} userId={userId} onRestore={handleRestoreHistory} onHistoryChange={refreshHistory} />
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {(phase === 'running' || phase === 'done') && (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '20px', alignItems: 'start' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
              <SectionLabel color="var(--cyan)">PIPELINE</SectionLabel>

              {/* ✅ FIX: pass pipelineStep directly + isDone prop */}
              <Pipeline
                currentStep={phase === 'done' ? 'report' : pipelineStep}
                claimCount={claims.length}
                verifiedCount={verifiedCount}
              />

              {analysisMode === 'factcheck' && claims.length > 0 && (
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

              {history.length > 0 && (
                <>
                  <SectionLabel color="var(--cyan)">HISTORY</SectionLabel>
                  <HistoryPanel history={history} userId={userId} onRestore={handleRestoreHistory} onHistoryChange={refreshHistory} />
                </>
              )}
            </div>

            {/* CENTER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                      {phase === 'done' && results.length === claims.length && (
                        <ClaimHighlight text={inputText} claims={claims} results={results} />
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <SectionLabel color="var(--cyan)">
                    {imageResult ? 'IMAGE AI DETECTION' : 'AI DETECTION RESULT'}
                  </SectionLabel>
                  {phase === 'done' ? (
                    imageResult
                      ? <ImageAIResult result={imageResult} previewUrl={imagePreviewUrl} />
                      : <AIDetectionResult result={aiDetection} />
                  ) : (
                    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', letterSpacing: '1px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                      {imagePreviewUrl ? 'ANALYZING IMAGE...' : 'ANALYZING AUTHORSHIP...'}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
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
                        { label: 'AI PROBABILITY', val: `${aiDetection?.aiScore ?? 0}%`, color: 'var(--red)' },
                        { label: 'HUMAN PROBABILITY', val: `${aiDetection?.humanScore ?? 0}%`, color: 'var(--green)' },
                        { label: 'VERDICT', val: aiDetection?.verdict || '—', color: aiDetection?.verdict === 'LIKELY AI' ? 'var(--red)' : aiDetection?.verdict === 'LIKELY HUMAN' ? 'var(--green)' : 'var(--orange)' },
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

      {showLive && <LiveFactCheck onClose={() => setShowLive(false)} />}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div onClick={() => setShowShareModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '24px', background: 'var(--bg1)', border: '1px solid var(--line2)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', animation: 'fadeUp 0.2s ease both', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '16px', background: 'var(--green)' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: '16px', letterSpacing: '2px', color: 'var(--green)' }}>SHARE REPORT</span>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--dim)', fontSize: '16px', cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = 'var(--red)'} onMouseLeave={e => e.target.style.color = 'var(--dim)'}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {(() => {
                const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
                results.forEach(r => { if (r && verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
                const total = results.filter(Boolean).length;
                const score = total > 0 ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
                const scoreColor = score >= 75 ? 'var(--green)' : score >= 40 ? 'var(--orange)' : 'var(--red)';
                return (
                  <div style={{ padding: '16px', marginBottom: '16px', border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '28px', height: '28px', border: '1px solid var(--a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--a1)', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--display)', fontSize: '16px', letterSpacing: '2px', color: 'var(--a1)' }}>CredenceAI</span>
                    </div>
                    {analysisMode === 'factcheck' ? (
                      <>
                        <div style={{ fontFamily: 'var(--display)', fontSize: '36px', color: scoreColor, letterSpacing: '2px', lineHeight: 1 }}>{score}%</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginTop: '2px', marginBottom: '10px' }}>ACCURACY SCORE</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[['TRUE', 'var(--green)', verdicts.TRUE], ['PARTIAL', 'var(--orange)', verdicts['PARTIALLY TRUE']], ['FALSE', 'var(--red)', verdicts.FALSE]].map(([label, color, count]) => (
                            <div key={label} style={{ padding: '3px 10px', border: `1px solid ${color}44`, borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '10px', color, background: `${color}10` }}>{count} {label}</div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'var(--display)', fontSize: '36px', color: 'var(--red)', letterSpacing: '2px', lineHeight: 1 }}>{aiDetection?.aiScore || 0}%</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginTop: '2px', marginBottom: '10px' }}>AI SCORE</div>
                        <div style={{ padding: '3px 10px', border: '1px solid rgba(255,69,96,0.4)', borderRadius: 'var(--radius)', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--red)', background: 'var(--red-dim)', display: 'inline-block' }}>{aiDetection?.verdict || 'UNCERTAIN'}</div>
                      </>
                    )}
                    <div style={{ marginTop: '10px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' }}>Powered by Gemini + Tavily · CredenceAI.app</div>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={copyShareText} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: shareCopied ? 'rgba(0,232,135,0.08)' : 'var(--bg2)', border: `1px solid ${shareCopied ? 'var(--green)' : 'var(--line2)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}>
                  <span style={{ fontSize: '18px' }}>{shareCopied ? '✓' : '📋'}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: shareCopied ? 'var(--green)' : 'var(--text)', letterSpacing: '1px' }}>{shareCopied ? 'COPIED!' : 'COPY SUMMARY TEXT'}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>Copy report summary to paste anywhere</div>
                  </div>
                </button>
                <button onClick={() => {
                  const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
                  results.forEach(r => { if (r && verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
                  const total = results.filter(Boolean).length;
                  const score = total > 0 ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / total) * 100) : 0;
                  const text = analysisMode === 'factcheck'
                    ? `Just fact-checked an article with CredenceAI 🔍\n\nAccuracy: ${score}% | ✓${verdicts.TRUE} TRUE · ✗${verdicts.FALSE} FALSE\n\nPowered by real-time Tavily search + Gemini AI\n#CredenceAI #FactCheck #AI`
                    : `Just ran AI detection on a text with CredenceAI 🤖\n\nAI Score: ${aiDetection?.aiScore || 0}% — ${aiDetection?.verdict || 'UNCERTAIN'}\n\n#CredenceAI #AIDetection`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1d9bf0'; e.currentTarget.style.background = 'rgba(29,155,240,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
                  <span style={{ fontSize: '18px' }}>𝕏</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', letterSpacing: '1px' }}>SHARE ON X / TWITTER</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>Open X with pre-filled tweet</div>
                  </div>
                </button>
                <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://CredenceAI.app')}`, '_blank')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a66c2'; e.currentTarget.style.background = 'rgba(10,102,194,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
                  <span style={{ fontSize: '18px' }}>in</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', letterSpacing: '1px' }}>SHARE ON LINKEDIN</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>Share to your LinkedIn feed</div>
                  </div>
                </button>
                <button onClick={() => { downloadReport({ claims, results, aiDetection, bias: biasData, inputText, mode: analysisMode }); setShowShareModal(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
                  <span style={{ fontSize: '18px' }}>↓</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', letterSpacing: '1px' }}>DOWNLOAD PDF REPORT</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>Save full styled report as PDF</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}