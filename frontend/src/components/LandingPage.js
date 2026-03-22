import React, { useEffect, useRef, useState } from 'react';
import Background from './Background';

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.unobserve(el); }
    }, { threshold: 0.12, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Counter({ end, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function Section({ id, children, style }) {
  const [ref, inView] = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`landing-section ${inView ? 'landing-section--visible' : ''}`}
      style={style}
    >
      {children}
    </section>
  );
}

function FeatureCard({ icon, title, description, color, delay }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className="landing-feature-card glass-card"
      style={{
        animationDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      <div className="landing-feature-icon" style={{ background: `${color}18`, color, borderColor: `${color}40` }}>
        {icon}
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
      <div className="landing-feature-glow" style={{ background: `radial-gradient(ellipse, ${color}12 0%, transparent 70%)` }} />
    </div>
  );
}

function PipelineStep({ number, title, description, color, isLast }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`landing-step ${inView ? 'landing-step--visible' : ''}`}>
      <div className="landing-step-indicator">
        <div className="landing-step-number" style={{ borderColor: color, color, boxShadow: `0 0 16px ${color}30` }}>
          {String(number).padStart(2, '0')}
        </div>
        {!isLast && <div className="landing-step-line" style={{ background: `linear-gradient(to bottom, ${color}60, transparent)` }} />}
      </div>
      <div className="landing-step-content">
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px,4vw,26px)', letterSpacing: '3px', color }}>{title}</h3>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.8', letterSpacing: '0.3px', marginTop: '8px' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function TechBadge({ name, icon, color }) {
  return (
    <div className="landing-tech-badge" style={{ borderColor: `${color}40` }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color, letterSpacing: '1.5px', textAlign: 'center' }}>{name}</span>
    </div>
  );
}

export default function LandingPage({ onEnter, isSignedIn }) {
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />

      {/* ─── NAVIGATION ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="landing-logo-mark">
              <div style={{
                width: '10px', height: '10px', background: 'var(--a1)',
                clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                animation: 'pulse 2s ease infinite',
              }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? '18px' : '22px', letterSpacing: '3px', color: 'var(--a1)', lineHeight: 1 }}>CredenceAI</div>
              {!isMobile && <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)', letterSpacing: '2px' }}>FACT VERIFICATION ENGINE</div>}
            </div>
          </div>
          <div className="landing-nav-links">
            {!isMobile && ['features', 'how-it-works', 'tech'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="landing-nav-link">
                {id.replace(/-/g, ' ').toUpperCase()}
              </button>
            ))}
            <button onClick={onEnter} className="landing-nav-cta">
              {isSignedIn ? 'OPEN APP' : 'GET STARTED'}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '3px', marginBottom: '18px' }}>
             AI-POWERED INTELLIGENCE PLATFORM
          </div>
          <h1 className="landing-hero-title">
            <span>VERIFY</span>
            <span className="gradient-text">TRUTH</span>
            <span style={{ fontSize: 'clamp(22px,4vw,48px)', color: 'var(--dim)', letterSpacing: '2px' }}>IN REAL TIME</span>
          </h1>
          <p className="landing-hero-subtitle">
            {isMobile
              ? 'Paste any text — CredenceAI extracts claims, cross-references evidence, and delivers an accuracy report with sources.'
              : 'Paste any article or text — CredenceAI extracts every factual claim, cross-references evidence from multiple sources, and delivers a color-coded accuracy report with cited sources and confidence scores. Powered by Google Gemini.'}
          </p>
          <div className="landing-hero-actions">
            <button onClick={onEnter} className="btn-primary landing-hero-btn">
              {isSignedIn ? 'OPEN DASHBOARD →' : 'START VERIFYING →'}
            </button>
            {!isMobile && (
              <button onClick={() => scrollTo('how-it-works')} className="btn-ghost" style={{ padding: '12px 24px' }}>
                SEE HOW IT WORKS
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="landing-hero-stats">
            {[
              { label: 'CLAIMS ANALYZED', value: 50000, suffix: '+', color: 'var(--a1)' },
              { label: 'ACCURACY RATE', value: 97, suffix: '%', color: 'var(--green)' },
              { label: 'SOURCES CHECKED', value: 200, suffix: 'K+', color: 'var(--cyan)' },
              { label: 'RESPONSE TIME', value: 3, suffix: 's AVG', color: 'var(--orange)' },
            ].map(s => (
              <div key={s.label} className="landing-stat-card">
                <div style={{ fontFamily: 'var(--display)', fontSize: isMobile ? '28px' : '36px', color: s.color, lineHeight: 1 }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1.5px', marginTop: '6px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="landing-hero-grid" />
      </section>

      {/* ─── FEATURES ── */}
      <Section id="features">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="mono-label" style={{ marginBottom: '12px' }}> CAPABILITIES</div>
            <h2 className="landing-section-title">INTELLIGENT <span style={{ color: 'var(--a1)' }}>VERIFICATION</span></h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', maxWidth: '560px', margin: '12px auto 0', lineHeight: '1.8', letterSpacing: '0.3px' }}>
              Six powerful modules working in concert to deliver thorough fact-checking analysis.
            </p>
          </div>
          <div className="landing-features-grid">
            <FeatureCard icon="🔍" title="CLAIM EXTRACTION" description="Chain-of-Thought AI breaks down any text into atomic, verifiable claims — separating fact from opinion automatically." color="var(--a1)" delay={0} />
            <FeatureCard icon="🌐" title="EVIDENCE RETRIEVAL" description="Multi-source search retrieves and ranks relevant evidence from across knowledge sources in real time." color="var(--cyan)" delay={100} />
            <FeatureCard icon="✅" title="SMART VERIFICATION" description="Self-reflection prompting challenges initial assessments, weighing source reliability and temporal relevance." color="var(--green)" delay={200} />
            <FeatureCard icon="🤖" title="AI CONTENT DETECTION" description="Detects AI-generated text with multi-signal analysis — perplexity patterns, vocabulary diversity, and burstiness scoring." color="var(--red)" delay={300} />
            <FeatureCard icon="⚡" title="REAL-TIME PIPELINE" description="Watch the AI think in real time — every step of the agentic pipeline streams live to your screen." color="var(--orange)" delay={400} />
            <FeatureCard icon="⚖️" title="CONFLICT RESOLUTION" description="When evidence contradicts, a resolution agent weighs authority, recency, and consensus to deliver fair verdicts." color="#a78bfa" delay={500} />
          </div>
        </div>
      </Section>

      {/* ─── HOW IT WORKS ── */}
      <Section id="how-it-works" style={{ background: 'rgba(11,17,24,0.5)' }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="mono-label" style={{ marginBottom: '12px' }}> PIPELINE</div>
            <h2 className="landing-section-title">HOW IT <span style={{ color: 'var(--cyan)' }}>WORKS</span></h2>
          </div>
          <div className="landing-pipeline">
            <PipelineStep number={1} title="PASTE YOUR CONTENT" color="var(--a1)" description="Drop in any article text or enter a claim you want verified. CredenceAI handles both raw text and file uploads." />
            <PipelineStep number={2} title="EXTRACT CLAIMS" color="var(--cyan)" description="Our Chain-of-Thought AI breaks the content into atomic, self-contained factual claims — each tagged and ready for verification." />
            <PipelineStep number={3} title="SEARCH & VERIFY" color="var(--green)" description="Each claim is independently verified against knowledge sources. A self-reflection loop challenges and refines every verdict." />
            <PipelineStep number={4} title="GET YOUR REPORT" color="var(--orange)" isLast description="Receive a comprehensive accuracy report with color-coded verdicts, confidence scores, cited sources, and AI content analysis." />
          </div>
        </div>
      </Section>

      {/* ─── TECH STACK ── */}
      <Section id="tech">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="mono-label" style={{ marginBottom: '12px' }}> POWERED BY</div>
            <h2 className="landing-section-title">BUILT WITH THE <span style={{ color: 'var(--green)' }}>BEST</span></h2>
          </div>
          <div className="landing-tech-grid">
            <TechBadge name="OPENAI GPT-4.0" icon="✦" color="var(--a1)" />
            <TechBadge name="REACT 18" icon="⚛️" color="#61dafb" />
            <TechBadge name="FASTAPI" icon="⚡" color="var(--green)" />
            <TechBadge name="CLERK AUTH" icon="🔐" color="var(--cyan)" />
            <TechBadge name="BEAUTIFULSOUP" icon="🔍" color="var(--orange)" />
            <TechBadge name="PYTHON 3.12" icon="🐍" color="#3ecf8e" />
          </div>
        </div>
      </Section>

      {/* ─── FINAL CTA ── */}
      <Section>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <div className="landing-cta-block">
            <div className="mono-label" style={{ marginBottom: '16px' }}> READY?</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(36px,6vw,72px)', letterSpacing: '4px', lineHeight: 0.95, color: 'var(--text)', marginBottom: '18px' }}>
              START <span className="gradient-text">VERIFYING</span> NOW
            </h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', maxWidth: '460px', margin: '0 auto 28px', lineHeight: '1.8', letterSpacing: '0.3px' }}>
              {isSignedIn
                ? 'Welcome back. Your dashboard is ready — jump straight into fact-checking.'
                : 'Join journalists, researchers, and curious minds who trust CredenceAI to separate fact from fiction.'}
            </p>
            <button onClick={onEnter} className="btn-primary landing-hero-btn" style={{ fontSize: isMobile ? '16px' : '20px', padding: isMobile ? '13px 32px' : '16px 48px' }}>
              {isSignedIn ? 'OPEN DASHBOARD →' : 'GET STARTED FREE →'}
            </button>
          </div>
        </div>
      </Section>

      {/* ─── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        padding: isMobile ? '16px 14px' : '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px',
        fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', background: 'var(--bg0)',
      }}>
        <span style={{ letterSpacing: '1px' }}>© 2026 CredenceAI · FACT VERIFICATION ENGINE</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--green)', animation: 'pulse 1.5s ease infinite' }}>●</span>
          <span>POWERED BY OPENAI</span>
        </div>
      </footer>
    </div>
  );
}