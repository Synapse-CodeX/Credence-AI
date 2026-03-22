// downloadReport.js — generates and downloads a PDF report via browser print

function openAndPrint(html, filename) {
  // Blob URL approach — avoids deprecated document.write
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    alert('Please allow pop-ups to download the report.');
    URL.revokeObjectURL(url);
    return;
  }
  win.addEventListener('load', () => {
    win.document.title = filename;
    setTimeout(() => {
      win.focus();
      win.print();
      win.addEventListener('afterprint', () => {
        win.close();
        URL.revokeObjectURL(url);
      });
    }, 400);
  });
}

export function downloadReport({ claims, results, aiDetection, bias, inputText, mode }) {
  const now = new Date();
  const dateStr = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const BASE_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #fff; color: #111; padding: 32px; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    @page { margin: 18mm 14mm; size: A4; }
    .header { border-bottom: 2px solid #f0b429; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 30px; font-weight: bold; color: #f0b429; letter-spacing: 4px; }
    .logo-cyan { color: #00a8cc; }
    .subtitle { font-size: 9px; color: #666; letter-spacing: 3px; margin-top: 3px; }
    .meta { font-size: 10px; color: #888; margin-top: 10px; }
    .section-title { font-size: 9px; letter-spacing: 3px; color: #888; margin: 22px 0 10px; border-left: 3px solid #f0b429; padding-left: 8px; text-transform: uppercase; }
    .section-title.cyan { border-color: #00a8cc; }
    .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .score-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .score-card { background: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: center; }
    .score-val { font-size: 26px; font-weight: bold; letter-spacing: 1px; }
    .score-label { font-size: 8px; color: #888; letter-spacing: 1.5px; margin-top: 3px; }
    .claim-card { border: 1px solid #ddd; border-left: 3px solid #ccc; margin-bottom: 12px; overflow: hidden; page-break-inside: avoid; }
    .claim-header { padding: 12px 14px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; background: #fafafa; }
    .claim-num { font-size: 8px; color: #999; letter-spacing: 2px; margin-bottom: 4px; }
    .claim-text { font-size: 12px; line-height: 1.6; flex: 1; }
    .verdict { font-size: 9px; letter-spacing: 1.5px; padding: 3px 8px; border-radius: 3px; white-space: nowrap; font-weight: bold; }
    .verdict-TRUE { color: #00a86b; border: 1px solid #00a86b; background: #f0fff8; }
    .verdict-FALSE { color: #d63031; border: 1px solid #d63031; background: #fff5f5; }
    .verdict-PARTIAL { color: #e17055; border: 1px solid #e17055; background: #fff8f5; }
    .verdict-UNVERIFIABLE { color: #888; border: 1px solid #aaa; background: #f5f5f5; }
    .claim-body { padding: 12px 14px; }
    .conf-row { display: flex; justify-content: space-between; font-size: 9px; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
    .conf-bar-bg { height: 4px; background: #eee; border-radius: 2px; margin-bottom: 10px; }
    .conf-bar-fill { height: 100%; border-radius: 2px; }
    .explanation { font-size: 11px; color: #555; line-height: 1.7; padding: 8px 10px; background: #f8f9fa; border: 1px solid #eee; border-left: 2px solid #ccc; margin-top: 8px; }
    .sources { margin-top: 8px; }
    .source-item { font-size: 10px; color: #0070cc; padding: 4px 8px; background: #f0f8ff; border: 1px solid #c8e0f0; margin-bottom: 3px; word-break: break-all; }
    .search-query { margin-top: 6px; font-size: 10px; color: #c0820a; }
    .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .ai-card { background: #f8f9fa; border: 1px solid #ddd; padding: 14px; text-align: center; }
    .ai-val { font-size: 28px; font-weight: bold; }
    .ai-label { font-size: 8px; color: #888; letter-spacing: 2px; margin-top: 3px; }
    .verdict-banner { padding: 16px 20px; border-radius: 4px; display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
    .big-score { font-size: 48px; font-weight: bold; line-height: 1; }
    .verdict-text { font-size: 22px; letter-spacing: 3px; font-weight: bold; }
    .signal-item { font-size: 10px; color: #555; padding: 6px 10px; background: #f8f9fa; border: 1px solid #eee; margin-bottom: 3px; display: flex; gap: 8px; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #ddd; font-size: 9px; color: #aaa; letter-spacing: 1px; }
    .input-snippet { font-size: 11px; color: #666; padding: 10px 12px; background: #f8f9fa; border: 1px solid #eee; line-height: 1.7; margin-top: 6px; }
    .bias-spectrum { height: 8px; border-radius: 4px; background: linear-gradient(90deg,#3b82f6,#93c5fd,#00a86b,#fca5a5,#d63031); margin: 8px 0; position: relative; }
    .bias-dot { width: 12px; height: 12px; border-radius: 50%; background: #f0b429; border: 2px solid #fff; box-shadow: 0 0 0 1px #ccc; position: absolute; top: 50%; transform: translate(-50%,-50%); }
    .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; background: #f0b429; border: none; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: bold; letter-spacing: 2px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 999; }
    .print-btn:hover { background: #e0a000; }
  `;

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

    const claimBorderColor = (verdict) =>
      verdict === 'TRUE' ? '#00a86b' : verdict === 'FALSE' ? '#d63031' : verdict === 'PARTIALLY TRUE' ? '#e17055' : '#ccc';
    const claimVClass = (verdict) =>
      verdict === 'TRUE' ? 'TRUE' : verdict === 'FALSE' ? 'FALSE' : verdict === 'PARTIALLY TRUE' ? 'PARTIAL' : 'UNVERIFIABLE';
    const accColor = accuracyScore >= 75 ? '#00a86b' : accuracyScore >= 40 ? '#e17055' : '#d63031';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CredenceAI Fact Check Report</title>
<style>${BASE_STYLES}</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">⬇ SAVE AS PDF</button>

<div class="header">
  <div class="logo">CredenceAI</div>
  <div class="subtitle">FACT VERIFICATION ENGINE — ANALYSIS REPORT</div>
  <div class="meta">Generated: ${dateStr} &nbsp;|&nbsp; Mode: FACT CHECK &nbsp;|&nbsp; Claims Analyzed: ${total}</div>
</div>

<div class="section-title">ANALYZED TEXT</div>
<div class="input-snippet">${(inputText || '').slice(0, 500).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${(inputText?.length || 0) > 500 ? '…' : ''}</div>

<div class="section-title">ACCURACY SUMMARY</div>
<div class="score-grid">
  <div class="score-card">
    <div class="score-val" style="color:${accColor}">${accuracyScore}%</div>
    <div class="score-label">ACCURACY SCORE</div>
  </div>
  <div class="score-card">
    <div class="score-val" style="color:#0070cc">${avgConf}%</div>
    <div class="score-label">AVG CONFIDENCE</div>
  </div>
  <div class="score-card">
    <div class="score-val" style="color:#c0820a">${total}</div>
    <div class="score-label">CLAIMS VERIFIED</div>
  </div>
</div>

<div class="section-title">VERDICT BREAKDOWN</div>
<div class="score-grid-4">
  ${[['TRUE','#00a86b',verdicts.TRUE],['PARTIALLY TRUE','#e17055',verdicts['PARTIALLY TRUE']],['FALSE','#d63031',verdicts.FALSE],['UNVERIFIABLE','#888',verdicts.UNVERIFIABLE]].map(([label,color,count]) => `
  <div class="score-card">
    <div class="score-val" style="color:${color}">${count}</div>
    <div class="score-label">${label}</div>
  </div>`).join('')}
</div>

<div class="section-title">EXTRACTED CLAIMS &amp; VERDICTS</div>
${claims.map((claim, i) => {
  const r = results[i];
  if (!r) return '';
  const confColor = r.confidence >= 75 ? '#00a86b' : r.confidence >= 40 ? '#e17055' : '#d63031';
  return `
<div class="claim-card" style="border-left-color:${claimBorderColor(r.verdict)}">
  <div class="claim-header">
    <div>
      <div class="claim-num">CLAIM ${String(i+1).padStart(2,'0')}</div>
      <div class="claim-text">${claim.claim.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>
    <span class="verdict verdict-${claimVClass(r.verdict)}">${r.verdict}</span>
  </div>
  <div class="claim-body">
    <div class="conf-row"><span>CONFIDENCE</span><span style="color:${confColor};font-weight:bold">${r.confidence}%</span></div>
    <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:${r.confidence}%;background:${confColor}"></div></div>
    <div class="explanation">${(r.explanation || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    ${r.conflicting ? `<div style="margin-top:8px;font-size:10px;color:#e17055;padding:5px 8px;border:1px solid #f5d0c0;background:#fff8f5">⚡ CONFLICTING SOURCES DETECTED — verdict based on majority evidence</div>` : ''}
    ${r.sources?.length ? `<div class="sources">${r.sources.map(s=>`<div class="source-item">↗ ${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}</div>` : ''}
    ${r.searchQuery ? `<div class="search-query">🔍 "${r.searchQuery.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</div>` : ''}
  </div>
</div>`;
}).join('')}

${aiDetection ? `
<div class="section-title">AI CONTENT DETECTION</div>
<div class="ai-grid">
  <div class="ai-card"><div class="ai-val" style="color:#d63031">${aiDetection.aiScore}%</div><div class="ai-label">AI-GENERATED</div></div>
  <div class="ai-card"><div class="ai-val" style="color:#00a86b">${aiDetection.humanScore}%</div><div class="ai-label">HUMAN-WRITTEN</div></div>
</div>
<div style="display:inline-block;font-size:10px;padding:4px 12px;border:1px solid #ddd;color:#555;letter-spacing:1.5px;margin-bottom:10px">${aiDetection.verdict}</div>
${aiDetection.signals?.length ? `${aiDetection.signals.map((s,i)=>`<div class="signal-item"><span style="color:#c0820a;min-width:24px">${String(i+1).padStart(2,'0')}</span>${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}` : ''}
` : ''}

${bias ? `
<div class="section-title">BIAS ANALYSIS</div>
<div class="score-grid">
  <div class="score-card"><div class="score-val" style="font-size:18px;color:#7c3aed">${bias.overallBias}</div><div class="score-label">POLITICAL LEAN</div></div>
  <div class="score-card"><div class="score-val" style="color:#00a86b">${bias.objectivityScore}%</div><div class="score-label">OBJECTIVITY</div></div>
  <div class="score-card"><div class="score-val" style="font-size:18px;color:#e17055">${bias.emotionalTone}</div><div class="score-label">TONE</div></div>
</div>
<div class="bias-spectrum"><div class="bias-dot" style="left:${Math.min(100,Math.max(0,(bias.biasScore+100)/2))}%"></div></div>
${bias.summary ? `<div class="explanation" style="margin-top:8px">${bias.summary.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
${bias.biasedPhrases?.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">${bias.biasedPhrases.map(p=>`<span style="padding:2px 8px;border:1px solid #c4b5fd;color:#7c3aed;font-size:10px">"${p.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</span>`).join('')}</div>` : ''}
` : ''}

<div class="footer">
  CredenceAI · FACT VERIFICATION ENGINE &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Powered by Google Gemini
</div>
</body>
</html>`;

    openAndPrint(html, `CredenceAI-factcheck-${Date.now()}.pdf`);

  } else {
    // AI detection mode
    const color = aiDetection?.verdict === 'LIKELY AI' ? '#d63031' : aiDetection?.verdict === 'LIKELY HUMAN' ? '#00a86b' : '#e17055';
    const bgColor = aiDetection?.verdict === 'LIKELY AI' ? '#fff5f5' : aiDetection?.verdict === 'LIKELY HUMAN' ? '#f0fff8' : '#fff8f5';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CredenceAI AI Detection Report</title>
<style>${BASE_STYLES.replace(/border-left: 3px solid #f0b429/g, 'border-left: 3px solid #00a8cc')}</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">⬇ SAVE AS PDF</button>

<div class="header" style="border-color:#00a8cc">
  <div class="logo" style="color:#00a8cc">CredenceAI</div>
  <div class="subtitle">AI CONTENT DETECTION REPORT</div>
  <div class="meta">Generated: ${dateStr}</div>
</div>

<div class="section-title cyan">ANALYZED TEXT</div>
<div class="input-snippet">${(inputText || '').slice(0, 500).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${(inputText?.length || 0) > 500 ? '…' : ''}</div>

${aiDetection ? `
<div class="section-title cyan">DETECTION RESULT</div>
<div class="verdict-banner" style="background:${bgColor};border:1px solid ${color}">
  <div>
    <div class="big-score" style="color:${color}">${aiDetection.aiScore}</div>
    <div style="font-size:9px;color:#888;letter-spacing:2px;margin-top:2px">% AI SCORE</div>
  </div>
  <div style="width:1px;height:50px;background:${color};opacity:0.3"></div>
  <div>
    <div class="verdict-text" style="color:${color}">${aiDetection.verdict}</div>
  </div>
</div>

<div class="ai-grid">
  <div class="ai-card"><div class="ai-val" style="color:#d63031">${aiDetection.aiScore}%</div><div class="ai-label">AI-GENERATED</div></div>
  <div class="ai-card"><div class="ai-val" style="color:#00a86b">${aiDetection.humanScore}%</div><div class="ai-label">HUMAN-WRITTEN</div></div>
</div>

${aiDetection.signals?.length ? `
<div class="section-title cyan">DETECTED SIGNALS</div>
${aiDetection.signals.map((s,i)=>`<div class="signal-item"><span style="color:#00a8cc;min-width:24px">${String(i+1).padStart(2,'0')}</span>${s.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}
` : ''}
` : ''}

<div class="footer">
  CredenceAI · AI DETECTION ENGINE &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Powered by Google Gemini
</div>
</body>
</html>`;

    openAndPrint(html, `CredenceAI-ai-detection-${Date.now()}.pdf`);
  }
}