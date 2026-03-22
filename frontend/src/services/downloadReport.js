// downloadReport.js — generates and downloads a plain text / HTML report

export function downloadReport({ claims, results, aiDetection, bias, inputText, mode }) {
  const now = new Date();
  const dateStr = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (mode === 'factcheck') {
    const verdicts = { TRUE: 0, 'PARTIALLY TRUE': 0, FALSE: 0, UNVERIFIABLE: 0 };
    results.forEach(r => { if (r && verdicts[r.verdict] !== undefined) verdicts[r.verdict]++; });
    const total = results.filter(Boolean).length;
    const accuracyScore = total > 0
      ? Math.round(((verdicts.TRUE + verdicts['PARTIALLY TRUE'] * 0.5) / total) * 100)
      : 0;
    const avgConf = total > 0
      ? Math.round(results.filter(Boolean).reduce((a, r) => a + (r.confidence || 0), 0) / total)
      : 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CredenceAI Fact Check Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #060a0f; color: #e8edf5; padding: 40px; }
  .header { border-bottom: 2px solid #f0b429; padding-bottom: 20px; margin-bottom: 32px; }
  .logo { font-size: 36px; font-weight: bold; color: #f0b429; letter-spacing: 4px; }
  .subtitle { font-size: 10px; color: #6b7a9e; letter-spacing: 3px; margin-top: 4px; }
  .meta { font-size: 11px; color: #6b7a9e; margin-top: 12px; }
  .section-title { font-size: 11px; letter-spacing: 3px; color: #6b7a9e; margin: 28px 0 12px; border-left: 3px solid #f0b429; padding-left: 10px; }
  .score-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .score-card { background: #0b1118; border: 1px solid #182030; padding: 16px; }
  .score-val { font-size: 32px; font-weight: bold; letter-spacing: 2px; }
  .score-label { font-size: 9px; color: #6b7a9e; letter-spacing: 2px; margin-top: 4px; }
  .claim-card { background: #0b1118; border: 1px solid #182030; margin-bottom: 16px; overflow: hidden; }
  .claim-header { padding: 14px 16px; border-bottom: 1px solid #182030; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .claim-text { font-size: 13px; line-height: 1.6; flex: 1; }
  .verdict { font-size: 10px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; white-space: nowrap; }
  .verdict-TRUE { color: #00e887; border: 1px solid #00e887; background: rgba(0,232,135,0.1); }
  .verdict-FALSE { color: #ff4560; border: 1px solid #ff4560; background: rgba(255,69,96,0.1); }
  .verdict-PARTIAL { color: #ff8c42; border: 1px solid #ff8c42; background: rgba(255,140,66,0.1); }
  .verdict-UNVERIFIABLE { color: #888; border: 1px solid #888; background: rgba(136,136,136,0.1); }
  .claim-body { padding: 14px 16px; }
  .conf-bar-wrap { margin-bottom: 12px; }
  .conf-bar-bg { height: 4px; background: #182030; border-radius: 2px; margin-top: 6px; }
  .conf-bar-fill { height: 100%; border-radius: 2px; }
  .explanation { font-size: 12px; color: #8899aa; line-height: 1.7; padding: 10px 12px; background: #060a0f; border: 1px solid #182030; margin-top: 10px; }
  .sources { margin-top: 10px; }
  .source-item { font-size: 11px; color: #00d4ff; padding: 5px 10px; background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15); margin-bottom: 4px; }
  .badge { display: inline-block; font-size: 9px; padding: 2px 8px; border-radius: 3px; margin-right: 6px; letter-spacing: 1px; }
  .badge-time { color: #ff8c42; border: 1px solid rgba(255,140,66,0.4); background: rgba(255,140,66,0.08); }
  .badge-diff { border: 1px solid currentColor; }
  .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
  .ai-card { background: #0b1118; border: 1px solid #182030; padding: 14px; text-align: center; }
  .ai-val { font-size: 28px; font-weight: bold; }
  .ai-label { font-size: 9px; color: #6b7a9e; letter-spacing: 2px; margin-top: 4px; }
  .bias-spectrum { height: 8px; border-radius: 4px; background: linear-gradient(90deg, #60a5fa, #93c5fd, #00e887, #fca5a5, #ff4560); margin: 10px 0; position: relative; }
  .bias-dot { width: 14px; height: 14px; border-radius: 50%; background: #f0b429; border: 2px solid #060a0f; position: absolute; top: 50%; transform: translate(-50%,-50%); }
  .signal-item { font-size: 11px; color: #8899aa; padding: 8px 12px; background: #0b1118; border: 1px solid #182030; margin-bottom: 4px; display: flex; gap: 8px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #182030; font-size: 10px; color: #6b7a9e; letter-spacing: 1px; }
  .input-snippet { font-size: 12px; color: #8899aa; padding: 12px; background: #0b1118; border: 1px solid #182030; line-height: 1.7; margin-top: 8px; max-height: 80px; overflow: hidden; }
  h1, h2, h3 { font-weight: normal; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">CredenceAI</div>
  <div class="subtitle">FACT VERIFICATION ENGINE — ANALYSIS REPORT</div>
  <div class="meta">Generated: ${dateStr} &nbsp;|&nbsp; Mode: FACT CHECK &nbsp;|&nbsp; Claims: ${total}</div>
</div>

<!-- Input snippet -->
<div class="section-title">ANALYZED TEXT</div>
<div class="input-snippet">${(inputText || '').slice(0, 400).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${inputText?.length > 400 ? '...' : ''}</div>

<!-- Score summary -->
<div class="section-title">ACCURACY SUMMARY</div>
<div class="score-grid">
  <div class="score-card">
    <div class="score-val" style="color:${accuracyScore >= 75 ? '#00e887' : accuracyScore >= 40 ? '#ff8c42' : '#ff4560'}">${accuracyScore}%</div>
    <div class="score-label">ACCURACY SCORE</div>
  </div>
  <div class="score-card">
    <div class="score-val" style="color:#00d4ff">${avgConf}%</div>
    <div class="score-label">AVG CONFIDENCE</div>
  </div>
  <div class="score-card">
    <div class="score-val" style="color:#f0b429">${total}</div>
    <div class="score-label">CLAIMS VERIFIED</div>
  </div>
</div>

<!-- Verdict breakdown -->
<div class="score-grid">
  ${[['TRUE','#00e887',verdicts.TRUE],['PARTIALLY TRUE','#ff8c42',verdicts['PARTIALLY TRUE']],['FALSE','#ff4560',verdicts.FALSE],['UNVERIFIABLE','#888',verdicts.UNVERIFIABLE]].map(([label,color,count]) => `
  <div class="score-card">
    <div class="score-val" style="color:${color}">${count}</div>
    <div class="score-label">${label}</div>
  </div>`).join('')}
</div>

<!-- Claims -->
<div class="section-title">EXTRACTED CLAIMS & VERDICTS</div>
${claims.map((claim, i) => {
  const r = results[i];
  if (!r) return '';
  const vClass = r.verdict === 'TRUE' ? 'TRUE' : r.verdict === 'FALSE' ? 'FALSE' : r.verdict === 'PARTIALLY TRUE' ? 'PARTIAL' : 'UNVERIFIABLE';
  const confColor = r.confidence >= 75 ? '#00e887' : r.confidence >= 40 ? '#ff8c42' : '#ff4560';
  return `
<div class="claim-card">
  <div class="claim-header">
    <div>
      <div style="font-size:9px;color:#6b7a9e;letter-spacing:2px;margin-bottom:6px">CLAIM ${String(i+1).padStart(2,'0')}</div>
      <div class="claim-text">${claim.claim.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <div style="margin-top:6px">
        ${r.timeSensitive ? '<span class="badge badge-time">⏰ TIME-SENSITIVE</span>' : ''}
        ${r.difficulty ? `<span class="badge badge-diff" style="color:${r.difficulty==='EASY'?'#00e887':r.difficulty==='MEDIUM'?'#ff8c42':'#ff4560'}">◆ ${r.difficulty}</span>` : ''}
      </div>
    </div>
    <span class="verdict verdict-${vClass}">${r.verdict}</span>
  </div>
  <div class="claim-body">
    <div class="conf-bar-wrap">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7a9e;letter-spacing:1px">
        <span>CONFIDENCE</span><span style="color:${confColor}">${r.confidence}%</span>
      </div>
      <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:${r.confidence}%;background:${confColor}"></div></div>
    </div>
    <div class="explanation">${(r.explanation || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    ${r.sources?.length ? `<div class="sources">${r.sources.map(s=>`<div class="source-item">↗ ${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}</div>` : ''}
    ${r.searchQuery ? `<div style="margin-top:8px;font-size:10px;color:#f0b429">🔍 "${r.searchQuery.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</div>` : ''}
  </div>
</div>`;
}).join('')}

<!-- AI Detection -->
${aiDetection ? `
<div class="section-title">AI CONTENT DETECTION</div>
<div class="ai-grid">
  <div class="ai-card"><div class="ai-val" style="color:#ff4560">${aiDetection.aiScore}%</div><div class="ai-label">AI-GENERATED</div></div>
  <div class="ai-card"><div class="ai-val" style="color:#00e887">${aiDetection.humanScore}%</div><div class="ai-label">HUMAN-WRITTEN</div></div>
</div>
<div style="font-size:11px;padding:6px 12px;border:1px solid #182030;display:inline-block;color:#8899aa;letter-spacing:1.5px">${aiDetection.verdict}</div>
${aiDetection.signals?.length ? `<div style="margin-top:12px">${aiDetection.signals.map((s,i)=>`<div class="signal-item"><span style="color:#f0b429">${String(i+1).padStart(2,'0')}</span>${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}</div>` : ''}
` : ''}

<!-- Bias -->
${bias ? `
<div class="section-title">BIAS ANALYSIS</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
  <div class="score-card"><div class="score-val" style="font-size:18px;color:#a78bfa">${bias.overallBias}</div><div class="score-label">POLITICAL LEAN</div></div>
  <div class="score-card"><div class="score-val" style="color:#00e887">${bias.objectivityScore}%</div><div class="score-label">OBJECTIVITY</div></div>
  <div class="score-card"><div class="score-val" style="font-size:18px;color:#ff8c42">${bias.emotionalTone}</div><div class="score-label">TONE</div></div>
</div>
<div class="bias-spectrum"><div class="bias-dot" style="left:${Math.min(100,Math.max(0,(bias.biasScore+100)/2))}%"></div></div>
${bias.summary ? `<div class="explanation">${bias.summary.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
${bias.biasedPhrases?.length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">${bias.biasedPhrases.map(p=>`<span style="padding:3px 10px;border:1px solid rgba(167,139,250,0.3);color:#a78bfa;font-size:10px">"${p.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</span>`).join('')}</div>` : ''}
` : ''}

<div class="footer">
  CredenceAI · FACT VERIFICATION ENGINE &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Powered by Google Gemini
</div>

</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CredenceAI-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // AI detection mode report
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CredenceAI AI Detection Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #060a0f; color: #e8edf5; padding: 40px; }
  .header { border-bottom: 2px solid #00d4ff; padding-bottom: 20px; margin-bottom: 32px; }
  .logo { font-size: 36px; font-weight: bold; color: #00d4ff; letter-spacing: 4px; }
  .subtitle { font-size: 10px; color: #6b7a9e; letter-spacing: 3px; margin-top: 4px; }
  .meta { font-size: 11px; color: #6b7a9e; margin-top: 12px; }
  .section-title { font-size: 11px; letter-spacing: 3px; color: #6b7a9e; margin: 28px 0 12px; border-left: 3px solid #00d4ff; padding-left: 10px; }
  .verdict-banner { padding: 24px 28px; border-radius: 6px; display: flex; align-items: center; gap: 24px; margin-bottom: 20px; }
  .big-score { font-size: 56px; font-weight: bold; line-height: 1; }
  .verdict-text { font-size: 28px; letter-spacing: 3px; font-weight: bold; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .card { background: #0b1118; border: 1px solid #182030; padding: 16px; text-align: center; }
  .card-val { font-size: 28px; font-weight: bold; }
  .card-label { font-size: 9px; color: #6b7a9e; letter-spacing: 2px; margin-top: 4px; }
  .signal-item { font-size: 11px; color: #8899aa; padding: 8px 12px; background: #0b1118; border: 1px solid #182030; margin-bottom: 4px; display: flex; gap: 8px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #182030; font-size: 10px; color: #6b7a9e; }
  .input-snippet { font-size: 12px; color: #8899aa; padding: 12px; background: #0b1118; border: 1px solid #182030; line-height: 1.7; margin-top: 8px; max-height: 80px; overflow: hidden; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">CredenceAI</div>
  <div class="subtitle">AI CONTENT DETECTION REPORT</div>
  <div class="meta">Generated: ${dateStr}</div>
</div>

<div class="section-title">ANALYZED TEXT</div>
<div class="input-snippet">${(inputText || '').slice(0, 400).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${inputText?.length > 400 ? '...' : ''}</div>

${aiDetection ? `
<div class="section-title">DETECTION RESULT</div>
<div class="verdict-banner" style="background:${aiDetection.verdict==='LIKELY AI'?'rgba(255,69,96,0.08)':aiDetection.verdict==='LIKELY HUMAN'?'rgba(0,232,135,0.08)':'rgba(255,140,66,0.08)'};border:1px solid ${aiDetection.verdict==='LIKELY AI'?'#ff4560':aiDetection.verdict==='LIKELY HUMAN'?'#00e887':'#ff8c42'}">
  <div>
    <div class="big-score" style="color:${aiDetection.verdict==='LIKELY AI'?'#ff4560':aiDetection.verdict==='LIKELY HUMAN'?'#00e887':'#ff8c42'}">${aiDetection.aiScore}</div>
    <div style="font-size:9px;color:#6b7a9e;letter-spacing:2px;margin-top:2px">% AI SCORE</div>
  </div>
  <div>
    <div class="verdict-text" style="color:${aiDetection.verdict==='LIKELY AI'?'#ff4560':aiDetection.verdict==='LIKELY HUMAN'?'#00e887':'#ff8c42'}">${aiDetection.verdict}</div>
  </div>
</div>
<div class="grid">
  <div class="card"><div class="card-val" style="color:#ff4560">${aiDetection.aiScore}%</div><div class="card-label">AI-GENERATED</div></div>
  <div class="card"><div class="card-val" style="color:#00e887">${aiDetection.humanScore}%</div><div class="card-label">HUMAN-WRITTEN</div></div>
</div>
${aiDetection.signals?.length ? `
<div class="section-title">DETECTED SIGNALS</div>
${aiDetection.signals.map((s,i)=>`<div class="signal-item"><span style="color:#00d4ff">${String(i+1).padStart(2,'0')}</span>${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}` : ''}
` : ''}

<div class="footer">CredenceAI · AI DETECTION ENGINE &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Powered by Google Gemini</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CredenceAI-ai-detection-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}