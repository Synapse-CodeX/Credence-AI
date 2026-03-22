import React, { useState, useRef } from 'react';
import Background from './components/Background';
import Header from './components/Header';
import Footer from './components/Footer';
import InputPanel from './components/InputPanel';
import Pipeline from './components/Pipeline';
import ClaimCard from './components/ClaimCard';
import SummaryReport from './components/SummaryReport';
import { extractAndVerifyAll, detectAIContent, fetchUrlText } from './services/api';

function SectionLabel({ color = 'var(--a1)', children }) {
  return (
    <div className="section-label">
      <div className="section-label__bar" style={{ background: color }} />
      <span className="section-label__text" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="glass-card" style={{
      padding: '48px 24px', textAlign: 'center',
      border: '1px dashed var(--line2)',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '14px', opacity: 0.3 }}>◈</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: '11px',
        color: 'var(--dim)', letterSpacing: '1.2px',
      }}>
        {message}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(null);
  const [claims, setClaims] = useState([]);
  const [results, setResults] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [aiDetection, setAiDetection] = useState(null);
  const [error, setError] = useState(null);
  const [articleMeta, setArticleMeta] = useState(null);
  const dashboardRef = useRef(null);

  const handleAnalyze = async ({ mode, content }) => {
    try {
      setPhase('running'); setError(null);
      setClaims([]); setResults([]); setVerifiedCount(0);
      setAiDetection(null); setArticleMeta(null);

      // Smooth scroll to dashboard after a short delay
      setTimeout(() => {
        dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

      let text = content;
      if (mode === 'url') {
        setPipelineStep('fetch');
        const fetched = await fetchUrlText(content);
        text = fetched.text;
        setArticleMeta({ title: fetched.title, source: fetched.source });
      }

      // Step 1: Extract + Verify all claims in a single API call
      setPipelineStep('extract');
      const allResults = await extractAndVerifyAll(text);

      // Extract just the claim parts for display
      const extractedClaims = allResults.map(r => ({
        id: r.id,
        claim: r.claim,
        context: r.context,
      }));
      setClaims(extractedClaims);

      // Simulate the pipeline progression for visual effect
      setPipelineStep('search');
      await new Promise(r => setTimeout(r, 800));

      setPipelineStep('verify');
      // Progressively reveal results for a nice animation
      const verificationResults = [];
      for (let i = 0; i < allResults.length; i++) {
        const item = allResults[i];
        verificationResults.push({
          verdict: item.verdict,
          confidence: item.confidence,
          explanation: item.explanation,
          sources: item.sources,
          searchQuery: item.searchQuery,
          conflicting: item.conflicting,
        });
        setResults([...verificationResults]);
        setVerifiedCount(i + 1);
        await new Promise(r => setTimeout(r, 350));
      }

      // Step 2: AI Detection (separate call)
      setPipelineStep('report');
      const aiResult = await detectAIContent(text);
      setAiDetection(aiResult);
      setPhase('done');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleReset = () => {
    setPhase('idle'); setPipelineStep(null);
    setClaims([]); setResults([]); setVerifiedCount(0);
    setAiDetection(null); setError(null); setArticleMeta(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = phase === 'running';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Background />
      <Header />

      <main className="main-content" style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1320px', margin: '0 auto', width: '100%',
        padding: '36px 32px 80px',
        flex: 1,
      }}>

        {/* ════ HERO (idle only) ════ */}
        {phase === 'idle' && (
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.5s ease both' }}>
            <div className="hero-header" style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '20px', marginBottom: '24px',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
                  letterSpacing: '3px', marginBottom: '12px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{
                    display: 'inline-block', width: '20px', height: '1px',
                    background: 'var(--a1)',
                  }} />
                  INTELLIGENCE VERIFICATION PLATFORM
                </div>
                <h1 style={{
                  fontFamily: 'var(--display)',
                  fontSize: 'clamp(52px, 7vw, 96px)',
                  letterSpacing: '5px', lineHeight: 0.9,
                  color: 'var(--text)',
                }}>
                  <span className="hero-title">FACT</span><br />
                  <span style={{ color: 'var(--a1)' }} className="hero-title">CHECK</span>
                  <span className="hero-subtitle" style={{
                    fontSize: 'clamp(24px, 3.5vw, 44px)', color: 'var(--dim)',
                    marginLeft: '16px', letterSpacing: '3px',
                  }}>ENGINE</span>
                </h1>
              </div>
              <div className="hero-stats" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                maxWidth: '360px',
              }}>
                {[
                  { label: 'PIPELINE STEPS', val: '04', color: 'var(--a1)' },
                  { label: 'VERDICTS', val: '04', color: 'var(--cyan)' },
                  { label: 'AI MODEL', val: 'GEMINI', color: 'var(--green)' },
                  { label: 'STATUS', val: 'ONLINE', color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={s.label} className="glass-card" style={{
                    padding: '12px 16px',
                    animation: `fadeUp 0.4s ease ${0.1 + i * 0.08}s both`,
                  }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: '8px',
                      color: 'var(--dim)', letterSpacing: '1.5px', marginBottom: '6px',
                    }}>{s.label}</div>
                    <div style={{
                      fontFamily: 'var(--display)', fontSize: '20px',
                      color: s.color, letterSpacing: '2px',
                    }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* gradient divider */}
            <div style={{
              height: '1px', marginBottom: '32px',
              background: 'linear-gradient(90deg, var(--a1-dim), var(--line2) 50%, transparent)',
            }} />
          </div>
        )}

        {/* ════ RUNNING / DONE top bar ════ */}
        {phase !== 'idle' && (
          <div ref={dashboardRef} className="glass-card" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', marginBottom: '28px',
            flexWrap: 'wrap', gap: '12px',
            animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isLoading ? (
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid var(--a1)', borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: phase === 'error' ? 'var(--red)' : 'var(--green)',
                  boxShadow: `0 0 8px ${phase === 'error' ? 'var(--red)' : 'var(--green)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#060a0f', fontWeight: 'bold',
                }}>
                  {phase === 'error' ? '!' : '✓'}
                </div>
              )}
              <div>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  color: isLoading ? 'var(--a1)' : phase === 'error' ? 'var(--red)' : 'var(--green)',
                  letterSpacing: '1.2px',
                }}>
                  {isLoading ? 'ANALYSIS IN PROGRESS...' :
                   phase === 'error' ? 'ANALYSIS FAILED' : 'ANALYSIS COMPLETE'}
                </span>
                {articleMeta?.title && (
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '10px',
                    color: 'var(--dim)', marginTop: '3px',
                    maxWidth: '400px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {articleMeta.title}
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleReset} className="btn-ghost" id="reset-button">
              ↩ NEW ANALYSIS
            </button>
          </div>
        )}

        {/* ════ ERROR ════ */}
        {phase === 'error' && (
          <div style={{
            padding: '14px 20px', marginBottom: '24px',
            border: '1px solid rgba(255,69,96,0.35)',
            borderLeft: '3px solid var(--red)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--red-dim)',
            fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '12px', flexWrap: 'wrap',
            animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>⚠</span>
              <span>{error}</span>
            </div>
            <button
              onClick={handleReset}
              className="btn-ghost"
              style={{
                borderColor: 'rgba(255,69,96,0.3)',
                color: 'var(--red)',
              }}
            >
              ↻ TRY AGAIN
            </button>
          </div>
        )}

        {/* ════ IDLE / ERROR: Input ════ */}
        {(phase === 'idle' || phase === 'error') && (
          <InputPanel onAnalyze={handleAnalyze} loading={isLoading} />
        )}

        {/* ════ RUNNING / DONE: Dashboard ════ */}
        {(phase === 'running' || phase === 'done') && (
          <div className="dashboard-grid" style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr 280px',
            gap: '24px',
            alignItems: 'start',
          }}>
            {/* LEFT COLUMN — pipeline */}
            <div className="dashboard-sidebar" style={{
              display: 'flex', flexDirection: 'column', gap: '18px',
              position: 'sticky', top: '100px',
            }}>
              <SectionLabel color="var(--cyan)">PIPELINE</SectionLabel>
              <Pipeline
                currentStep={phase === 'done' ? 'report' : pipelineStep}
                claimCount={claims.length}
                verifiedCount={verifiedCount}
              />

              {/* claim counter */}
              {claims.length > 0 && (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 16px', background: 'var(--bg2)',
                    borderBottom: '1px solid var(--line)',
                    fontFamily: 'var(--mono)', fontSize: '9px',
                    color: 'var(--dim)', letterSpacing: '2px',
                  }}>CLAIM INDEX</div>
                  <div style={{
                    padding: '12px 16px',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    {claims.map((c, i) => {
                      const r = results[i];
                      const dotColor = !r ? 'var(--dim)' :
                        r.verdict === 'TRUE' ? 'var(--green)' :
                        r.verdict === 'FALSE' ? 'var(--red)' :
                        r.verdict === 'PARTIALLY TRUE' ? 'var(--orange)' : 'var(--muted)';
                      return (
                        <div key={c.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)',
                          padding: '4px 0',
                        }}>
                          <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: dotColor, flexShrink: 0,
                            boxShadow: r ? `0 0 6px ${dotColor}` : 'none',
                            animation: !r && isLoading ? 'pulse 1s ease infinite' : 'none',
                            transition: 'all 0.3s ease',
                          }} />
                          <span style={{
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', maxWidth: '180px',
                          }}>
                            {c.claim.slice(0, 40)}{c.claim.length > 40 ? '…' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER COLUMN — claims */}
            <div>
              <SectionLabel>EXTRACTED CLAIMS</SectionLabel>
              {claims.length === 0 ? (
                <div className="glass-card" style={{
                  padding: '48px', textAlign: 'center',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '2px solid var(--a1)', borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                  }} />
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: '11px',
                    color: 'var(--dim)', letterSpacing: '1.2px',
                  }}>EXTRACTING CLAIMS...</div>
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '12px',
                }}>
                  {claims.map((claim, i) => (
                    <ClaimCard
                      key={claim.id}
                      claim={claim}
                      result={results[i]}
                      index={i}
                      loading={isLoading && !results[i]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — report */}
            <div className="dashboard-sidebar" style={{
              display: 'flex', flexDirection: 'column', gap: '18px',
              position: 'sticky', top: '100px',
            }}>
              <SectionLabel color="var(--a1)">REPORT</SectionLabel>
              {phase === 'done' ? (
                <SummaryReport claims={claims} results={results} aiDetection={aiDetection} />
              ) : (
                <EmptyState message="REPORT GENERATES AFTER VERIFICATION" />
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}