// ══════════════════════════════════════════════════
//   CyberShield — AI-Powered Threat Analyzer
//   Powered by Claude AI (Anthropic)
// ══════════════════════════════════════════════════


// ── ANIMATED PARTICLE CANVAS ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * 1920, y: Math.random() * 1080,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
    col: ['#00ff88','#00d4ff','#ff2d55','#b06aff'][Math.floor(Math.random() * 4)]
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.col; ctx.fill();
  });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(0,212,255,${0.12 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();


// ══════════════════════════════════════════════════
//   AI CORE — Claude API Bridge
// ══════════════════════════════════════════════════

// Auto-detect endpoint: localhost when opened as file://, relative path when deployed
const AI_ENDPOINT = window.location.protocol === 'file:'
  ? 'http://localhost:3000/api/analyze'
  : '/api/analyze';

/**
 * Sends a prompt to Claude AI via our backend proxy.
 * Returns parsed JSON from Claude's response.
 */
async function analyzeWithAI(prompt) {
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || data.error);
  }

  // Parse the JSON that Claude returns as a string
  const raw = data.content?.[0]?.text;
  if (!raw) throw new Error('Empty response from AI');

  // Strip any accidental markdown code fences before parsing
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Show/hide a loading state inside a result container.
 */
function setLoading(outId, btnId, loading) {
  const btn = btnId ? document.getElementById(btnId) : null;
  if (btn) btn.disabled = loading;

  if (loading) {
    document.getElementById(outId).innerHTML = `
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <div class="ai-loading-text">
          <span style="color:var(--cyan);font-weight:600">Analyzing with Claude AI...</span>
          <span style="color:var(--muted);font-size:.72rem;margin-top:.25rem">This may take a few seconds</span>
        </div>
      </div>`;
  }
}

/**
 * Generic error renderer.
 */
function showError(outId, btnId, err) {
  const btn = btnId ? document.getElementById(btnId) : null;
  if (btn) btn.disabled = false;

  const isConnectionErr = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
  document.getElementById(outId).innerHTML = `
    <div class="result-warn" style="margin-bottom:.5rem">⚠ AI Analysis Failed</div>
    <div style="color:var(--muted);font-size:.8rem;margin-bottom:.5rem">${err.message}</div>
    ${isConnectionErr ? `
    <div class="ai-server-hint">
      <strong style="color:var(--cyan)">💡 Is the local server running?</strong><br>
      Open a terminal in your project folder and run:<br>
      <code>node server.js</code><br>
      Then make sure <code>ANTHROPIC_API_KEY</code> is set as an environment variable.
    </div>` : ''}
  `;
}


// ══════════════════════════════════════════════════
//   TOOL 1 — PHISHING URL ANALYZER
// ══════════════════════════════════════════════════

async function analyzeURL() {
  const url = document.getElementById('url-input').value.trim();
  const out = document.getElementById('url-result');

  if (!url) {
    out.innerHTML = '<span class="result-warn">⚠ Please enter a URL to analyze.</span>';
    return;
  }

  setLoading('url-result', 'url-btn', true);

  const prompt = `You are a cybersecurity expert specializing in phishing detection.

Analyze the following URL for phishing indicators:
URL: ${url}

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "SAFE" | "SUSPICIOUS" | "DANGEROUS",
  "risk_score": <0-100>,
  "indicators": ["list", "of", "specific red flags found"],
  "explanation": "2-3 sentence analysis of why this URL is or isn't phishing",
  "recommendations": ["what the user should do"]
}

Check for: suspicious TLDs (.xyz .tk .ml .pw .click), brand impersonation, lookalike domains (paypa1, g00gle), excessive subdomains, URL shorteners (bit.ly, tinyurl), HTTP vs HTTPS, unusual characters, login/account/verify/secure keywords, IP addresses used as hostnames, homograph attacks.`;

  try {
    const result = await analyzeWithAI(prompt);
    renderURLResult(result);
  } catch (err) {
    showError('url-result', 'url-btn', err);
  } finally {
    document.getElementById('url-btn').disabled = false;
  }
}

function renderURLResult(r) {
  const out = document.getElementById('url-result');
  const scoreColor = r.risk_score < 30 ? 'var(--green)' : r.risk_score < 60 ? 'var(--orange)' : 'var(--red)';
  const cls   = r.verdict === 'SAFE' ? 'result-safe' : r.verdict === 'SUSPICIOUS' ? 'result-warn' : 'result-danger';
  const icon  = r.verdict === 'SAFE' ? '✅' : r.verdict === 'SUSPICIOUS' ? '⚠️' : '🚨';
  const bar   = Math.min(r.risk_score, 100);

  out.innerHTML = `
    <div class="${cls}" style="font-weight:700;font-size:.9rem;margin-bottom:.6rem">${icon} ${r.verdict}</div>
    <div style="color:var(--text);font-size:.82rem;margin-bottom:.9rem;line-height:1.55">${r.explanation}</div>

    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
      <div style="color:var(--muted);font-size:.72rem;white-space:nowrap">RISK SCORE</div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${bar}%;background:${scoreColor}"></div></div>
      <div style="color:${scoreColor};font-weight:700;font-family:var(--mono);font-size:.85rem">${r.risk_score}/100</div>
      <span class="ai-badge">🤖 Claude AI</span>
    </div>

    ${r.indicators && r.indicators.length > 0 ? `
      <div style="color:var(--muted);font-size:.7rem;letter-spacing:1px;margin-bottom:.4rem">⚑ INDICATORS FOUND</div>
      <div class="indicator-list">
        ${r.indicators.map(i => `<div class="indicator-item">⚠ ${i}</div>`).join('')}
      </div>` : `<div style="color:var(--green);font-size:.82rem">✅ No phishing indicators detected.</div>`}

    ${r.recommendations && r.recommendations.length > 0 ? `
      <div style="color:var(--muted);font-size:.7rem;letter-spacing:1px;margin:.75rem 0 .4rem">📋 RECOMMENDATIONS</div>
      ${r.recommendations.map(rec => `<div style="color:var(--cyan);font-size:.8rem;margin:.2rem 0">→ ${rec}</div>`).join('')}` : ''}
  `;
}

document.getElementById('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeURL(); });


// ══════════════════════════════════════════════════
//   TOOL 2 — MALWARE FILE CHECKER
// ══════════════════════════════════════════════════

async function analyzeFile() {
  const fname = document.getElementById('file-input').value.trim();
  const out = document.getElementById('file-result');

  if (!fname) {
    out.innerHTML = '<span class="result-warn">⚠ Please enter a filename.</span>';
    return;
  }

  setLoading('file-result', 'file-btn', true);

  const prompt = `You are a malware analyst. A user has submitted a filename for analysis.

Filename: ${fname}

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "CLEAN" | "SUSPICIOUS" | "MALICIOUS",
  "risk_score": <0-100>,
  "file_type": "describe what kind of file this appears to be",
  "threat_type": "e.g. Ransomware / Trojan / Dropper / Worm / PUP / Safe / Unknown",
  "indicators": ["list", "of", "specific red flags found in the filename"],
  "explanation": "2-3 sentence explanation of your analysis",
  "recommendations": ["specific action steps for the user"]
}

Check for: double extensions (.pdf.exe, .docx.bat), known malware naming patterns (crack, keygen, patch, loader, hack, bypass, warez, invoice_), dangerous extensions (.exe .bat .cmd .vbs .ps1 .scr .com .jar .hta .pif .msi .lnk .reg .dll .sys), obfuscated names with random characters, system file impersonation (svchost, explorer, lsass in wrong locations), Unicode tricks (RTL override characters), excessive spaces before extension.`;

  try {
    const result = await analyzeWithAI(prompt);
    renderFileResult(result);
  } catch (err) {
    showError('file-result', 'file-btn', err);
  } finally {
    document.getElementById('file-btn').disabled = false;
  }
}

function renderFileResult(r) {
  const out = document.getElementById('file-result');
  const scoreColor = r.risk_score < 30 ? 'var(--green)' : r.risk_score < 60 ? 'var(--orange)' : 'var(--red)';
  const cls  = r.verdict === 'CLEAN' ? 'result-safe' : r.verdict === 'SUSPICIOUS' ? 'result-warn' : 'result-danger';
  const icon = r.verdict === 'CLEAN' ? '✅' : r.verdict === 'SUSPICIOUS' ? '⚠️' : '🚨';
  const bar  = Math.min(r.risk_score, 100);

  out.innerHTML = `
    <div class="${cls}" style="font-weight:700;font-size:.9rem;margin-bottom:.6rem">${icon} ${r.verdict} — ${r.threat_type}</div>
    <div style="color:var(--text);font-size:.82rem;margin-bottom:.9rem;line-height:1.55">${r.explanation}</div>

    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div style="color:var(--muted);font-size:.72rem;white-space:nowrap">RISK SCORE</div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${bar}%;background:${scoreColor}"></div></div>
      <div style="color:${scoreColor};font-weight:700;font-family:var(--mono);font-size:.85rem">${r.risk_score}/100</div>
      <span class="ai-badge">🤖 Claude AI</span>
    </div>
    <div style="color:var(--muted);font-size:.75rem;margin-bottom:.9rem">
      File type: <strong style="color:var(--cyan)">${r.file_type}</strong>
    </div>

    ${r.indicators && r.indicators.length > 0 ? `
      <div style="color:var(--muted);font-size:.7rem;letter-spacing:1px;margin-bottom:.4rem">⚑ INDICATORS FOUND</div>
      <div class="indicator-list">
        ${r.indicators.map(i => `<div class="indicator-item">⚠ ${i}</div>`).join('')}
      </div>` : `<div style="color:var(--green);font-size:.82rem">✅ No malware indicators detected.</div>`}

    ${r.recommendations && r.recommendations.length > 0 ? `
      <div style="color:var(--muted);font-size:.7rem;letter-spacing:1px;margin:.75rem 0 .4rem">📋 RECOMMENDATIONS</div>
      ${r.recommendations.map(rec => `<div style="color:var(--cyan);font-size:.8rem;margin:.2rem 0">→ ${rec}</div>`).join('')}` : ''}
  `;
}

document.getElementById('file-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeFile(); });


// ══════════════════════════════════════════════════
//   TOOL 3 — FILE CONTENT SCANNER (with Upload)
// ══════════════════════════════════════════════════

const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) readAndScan(file);
});

function scanUploadedFile(input) {
  const file = input.files[0];
  if (file) readAndScan(file);
}

function readAndScan(file) {
  const out = document.getElementById('upload-result');
  out.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">
        <span style="color:var(--cyan);font-weight:600">Reading file...</span>
      </div>
    </div>`;

  // Binary files — scan by filename/extension only
  const binaryExts = ['.exe','.dll','.sys','.bin','.com','.scr','.pif',
                      '.msi','.iso','.img','.dmg','.so','.dylib','.class',
                      '.jar','.apk','.elf','.o','.obj','.lib','.a','.rpm','.deb'];
  const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isBinary = binaryExts.includes(fileExt) || file.size > 2 * 1024 * 1024;

  if (isBinary) {
    scanContent(file.name, '', file.name, file.size, true);
    return;
  }

  const reader = new FileReader();
  reader.onload = e => scanContent(file.name, e.target.result, file.name, file.size, false);
  reader.onerror = () => {
    out.innerHTML = '<span class="result-warn">⚠ Could not read file content.</span>';
  };
  reader.readAsText(file);
}

async function scanContent(fname, content, origName, size, isBinary) {
  const out = document.getElementById('upload-result');

  // Show scanning state
  out.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">
        <span style="color:var(--cyan);font-weight:600">Scanning with Claude AI...</span>
        <span style="color:var(--muted);font-size:.72rem;margin-top:.25rem">Analyzing ${origName}</span>
      </div>
    </div>`;

  // Truncate large files — keep first 3000 chars
  const truncated = content.slice(0, 3000);
  const wasTruncated = content.length > 3000;

  const prompt = isBinary
    ? `You are a cybersecurity threat analyst. A binary file has been submitted for analysis. You cannot see its content, only its filename/extension.

Filename: ${fname}
File size: ${(size / 1024).toFixed(1)} KB
Note: This is a binary file — analyze based on filename, extension, and typical behavior of this file type.

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "CLEAN" | "SUSPICIOUS" | "MALICIOUS",
  "risk_score": <0-100>,
  "threats_found": {
    "malware": ["findings based on file type/name"],
    "phishing": [],
    "ddos": []
  },
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "3-4 sentence technical analysis based on the file type and name",
  "recommendations": ["action steps"]
}`
    : `You are a cybersecurity threat analyst. Analyze the following file content for malicious patterns.

Filename: ${fname}
File size: ${(size / 1024).toFixed(1)} KB
${wasTruncated ? '(Content truncated to first 3000 characters for analysis)\n' : ''}
File Content:
---
${truncated}
---

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "CLEAN" | "SUSPICIOUS" | "MALICIOUS",
  "risk_score": <0-100>,
  "threats_found": {
    "malware": ["specific patterns found"],
    "phishing": ["specific patterns found"],
    "ddos": ["specific patterns found"]
  },
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "3-4 sentence technical analysis of what was found and why it's concerning or safe",
  "recommendations": ["concrete action steps for the user"]
}

Look for: base64 obfuscation, eval()/exec() abuse, reverse shells, credential harvesting forms (password inputs submitting to HTTP), suspicious network calls (raw sockets, flood loops, threading for mass requests), PowerShell encoded commands (EncodedCommand, DownloadString, Invoke-Expression), dropper behavior (download and execute), fake form actions, keyloggers (keyboard hooks, keystroke logging), bitcoin wallet patterns, botnet C2 indicators (IRC channels, hardcoded IPs), registry persistence, scheduled task creation.`;

  try {
    const result = await analyzeWithAI(prompt);
    renderScanResult(result, origName, size, wasTruncated);
  } catch (err) {
    showError('upload-result', null, err);
  }
}

function renderScanResult(r, origName, size, wasTruncated) {
  const out = document.getElementById('upload-result');
  const scoreColor = r.risk_score < 25 ? 'var(--green)' : r.risk_score < 55 ? 'var(--orange)' : 'var(--red)';
  const cls  = r.verdict === 'CLEAN' ? 'result-safe' : r.verdict === 'SUSPICIOUS' ? 'result-warn' : 'result-danger';
  const icon = r.verdict === 'CLEAN' ? '✅' : r.verdict === 'SUSPICIOUS' ? '⚠️' : '🚨';
  const sevColor = { LOW: 'var(--green)', MEDIUM: 'var(--orange)', HIGH: 'var(--red)', CRITICAL: 'var(--red)' }[r.severity] || 'var(--muted)';
  const bar = Math.min(r.risk_score, 100);

  const threats = r.threats_found || { malware: [], phishing: [], ddos: [] };
  const hasThreats = threats.malware.length + threats.phishing.length + threats.ddos.length > 0;

  const badges = [
    threats.malware.length  > 0 ? `<span class="badge malware">🦠 Malware (${threats.malware.length})</span>`   : '',
    threats.phishing.length > 0 ? `<span class="badge phishing">🎣 Phishing (${threats.phishing.length})</span>` : '',
    threats.ddos.length     > 0 ? `<span class="badge ddos">💥 DDoS (${threats.ddos.length})</span>`            : '',
    !hasThreats ? '<span class="badge safe">✅ Clean</span>' : '',
  ].filter(Boolean).join('');

  const section = (title, items, col) => items.length === 0 ? '' : `
    <div style="margin-top:.75rem">
      <div style="color:${col};font-weight:600;font-size:.8rem;margin-bottom:.35rem">${title} (${items.length} found)</div>
      ${items.map(i => `<div class="indicator-item" style="border-color:${col}30">${i}</div>`).join('')}
    </div>`;

  out.innerHTML = `
    <div class="${cls}" style="font-weight:700;font-size:.9rem;margin-bottom:.6rem">${icon} ${r.verdict} — Severity: <span style="color:${sevColor}">${r.severity}</span></div>
    <div style="color:var(--text);font-size:.82rem;margin-bottom:.9rem;line-height:1.55">${r.explanation}</div>

    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div style="color:var(--muted);font-size:.72rem;white-space:nowrap">RISK SCORE</div>
      <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${bar}%;background:${scoreColor}"></div></div>
      <div style="color:${scoreColor};font-weight:700;font-family:var(--mono);font-size:.85rem">${r.risk_score}/100</div>
      <span class="ai-badge">🤖 Claude AI</span>
    </div>

    <div style="color:var(--muted);font-size:.72rem;margin-bottom:.9rem">
      📄 ${origName} &nbsp;|&nbsp; ${(size/1024).toFixed(1)} KB
      ${wasTruncated ? '&nbsp;|&nbsp; <span style="color:var(--orange)">⚠ Truncated to 3000 chars</span>' : ''}
    </div>

    <div class="scan-badges">${badges}</div>

    ${section('🦠 Malware Indicators',  threats.malware,  'var(--red)')}
    ${section('🎣 Phishing Indicators', threats.phishing, 'var(--orange)')}
    ${section('💥 DDoS Indicators',     threats.ddos,     'var(--cyan)')}

    ${!hasThreats ? '<div style="color:var(--green);margin-top:.5rem;font-size:.82rem">✅ No suspicious content patterns detected in file.</div>' : ''}

    ${r.recommendations && r.recommendations.length > 0 ? `
      <div style="color:var(--muted);font-size:.7rem;letter-spacing:1px;margin:.75rem 0 .4rem">📋 RECOMMENDATIONS</div>
      ${r.recommendations.map(rec => `<div style="color:var(--cyan);font-size:.8rem;margin:.2rem 0">→ ${rec}</div>`).join('')}` : ''}
  `;
}
