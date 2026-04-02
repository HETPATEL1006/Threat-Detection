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

  // Parse the JSON that Grok returns (OpenAI-compatible format)
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Grok AI');

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
//   TOOL 2 — MALWARE FILE CHECKER (Real Upload)
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

// ── Compute Shannon entropy of a byte array (0=uniform, 8=random/encrypted)
function computeEntropy(bytes) {
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;
  let entropy = 0;
  const len = bytes.length;
  for (const f of freq) {
    if (f === 0) continue;
    const p = f / len;
    entropy -= p * Math.log2(p);
  }
  return entropy.toFixed(2);
}

// ── Convert first N bytes to a readable hex string
function toHex(bytes, n = 64) {
  return Array.from(bytes.slice(0, n))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

// ── Identify the true file type from magic bytes
function detectMagic(bytes) {
  const h = bytes;
  const sig = [
    { magic: [0x4D, 0x5A],                          label: 'Windows PE Executable (MZ header)' },
    { magic: [0x7F, 0x45, 0x4C, 0x46],              label: 'ELF Executable (Linux/Unix binary)' },
    { magic: [0x50, 0x4B, 0x03, 0x04],              label: 'ZIP Archive (may contain executable payload)' },
    { magic: [0x50, 0x4B, 0x05, 0x06],              label: 'Empty ZIP Archive' },
    { magic: [0x52, 0x61, 0x72, 0x21],              label: 'RAR Archive' },
    { magic: [0x1F, 0x8B],                          label: 'GZIP Archive' },
    { magic: [0x25, 0x50, 0x44, 0x46],              label: 'PDF Document' },
    { magic: [0xD0, 0xCF, 0x11, 0xE0],              label: 'MS Office Document (OLE2 format, pre-2007)' },
    { magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A], label: 'PNG Image' },
    { magic: [0xFF, 0xD8, 0xFF],                    label: 'JPEG Image' },
    { magic: [0x47, 0x49, 0x46, 0x38],              label: 'GIF Image' },
    { magic: [0xCA, 0xFE, 0xBA, 0xBE],              label: 'Java Class File' },
    { magic: [0x23, 0x21],                          label: 'Unix Script (shebang)' },
    { magic: [0x4D, 0x53, 0x43, 0x46],              label: 'Microsoft Cabinet File' },
  ];
  for (const { magic, label } of sig) {
    if (magic.every((b, i) => h[i] === b)) return label;
  }
  // Check if printable text
  const printable = bytes.slice(0, 512).every(b => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13);
  return printable ? 'Plain text / script file' : 'Unknown binary format';
}

// ── Count suspicious tokens in text
function countSuspiciousTokens(text) {
  const patterns = [
    { label: 'eval() / exec() calls', re: /\beval\s*\(|\bexec\s*\(/gi },
    { label: 'Base64 encoded blobs', re: /[A-Za-z0-9+/]{60,}={0,2}/g },
    { label: 'PowerShell dangerous cmdlets', re: /Invoke-Expression|DownloadString|EncodedCommand|IEX\s*\(/gi },
    { label: 'Reverse shell patterns', re: /\/bin\/sh|\/bin\/bash|nc\s+-e|bash\s*-i|python\s+-c|socket\.connect/gi },
    { label: 'Network flood / DDoS code', re: /while\s*\(true\)|flood|sendto|recvfrom|socket\.send|threading\.Thread/gi },
    { label: 'Credential harvesting', re: /password|passwd|login|username|credential|api.key|secret/gi },
    { label: 'Registry manipulation', re: /HKEY_|RegCreateKey|RegSetValue|RegOpenKey/gi },
    { label: 'Process injection / shellcode', re: /VirtualAlloc|WriteProcessMemory|CreateRemoteThread|shellcode/gi },
    { label: 'Suspicious URL / IP patterns', re: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|pastebin\.com|discord\.gg|onion\./gi },
    { label: 'Keylogger / hook patterns', re: /SetWindowsHook|GetAsyncKeyState|keyboard_event|pynput|keylogger/gi },
  ];
  const found = [];
  for (const { label, re } of patterns) {
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      found.push(`${label} (×${matches.length})`);
    }
  }
  return found;
}

function readAndScan(file) {
  const out = document.getElementById('upload-result');
  out.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">
        <span style="color:var(--cyan);font-weight:600">Reading file bytes...</span>
        <span style="color:var(--muted);font-size:.72rem;margin-top:.25rem">Computing entropy & magic bytes</span>
      </div>
    </div>`;

  // Read raw bytes for ALL files (so we can compute entropy + magic bytes)
  const rawReader = new FileReader();
  rawReader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    const bytes = new Uint8Array(arrayBuffer);

    // Real metrics
    const entropy  = computeEntropy(bytes);
    const hexHeader = toHex(bytes, 64);
    const trueType  = detectMagic(bytes);

    // Determine if the file is binary by checking magic or extension
    const textExts = ['.txt','.html','.htm','.js','.ts','.py','.php','.rb','.sh',
                      '.bat','.ps1','.cmd','.vbs','.log','.csv','.json','.xml',
                      '.yaml','.yml','.md','.css','.sql','.conf','.ini','.env',
                      '.cfg','.c','.cpp','.h','.java','.cs','.go','.rs','.lua',
                      '.pl','.r','.m','.asm','.nasm','.s'];
    const fileExt   = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const isText    = textExts.includes(fileExt);
    const isLarge   = file.size > 2 * 1024 * 1024;

    // Extension vs true type mismatch detection
    const extMismatch = (() => {
      if (!trueType.includes('text') && !trueType.includes('Unknown') && isText) {
        return `⚠ Extension mismatch: file claims to be "${fileExt}" but magic bytes indicate "${trueType}"`;
      }
      return null;
    })();

    if (isText && !isLarge) {
      // Decode as text
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(bytes);

      // Pre-scan locally for suspicious tokens
      const localFindings = countSuspiciousTokens(text);

      await scanContent({
        fname: file.name,
        content: text,
        size: file.size,
        entropy,
        hexHeader,
        trueType,
        extMismatch,
        localFindings,
        isBinary: false,
        wasTruncated: text.length > 4000,
      });
    } else {
      await scanContent({
        fname: file.name,
        content: '',
        size: file.size,
        entropy,
        hexHeader,
        trueType,
        extMismatch,
        localFindings: [],
        isBinary: true,
        wasTruncated: false,
      });
    }
  };
  rawReader.onerror = () => {
    out.innerHTML = '<span class="result-warn">⚠ Could not read file. Try a different file.</span>';
  };
  rawReader.readAsArrayBuffer(file);
}

async function scanContent({ fname, content, size, entropy, hexHeader, trueType, extMismatch, localFindings, isBinary, wasTruncated }) {
  const out = document.getElementById('upload-result');

  out.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">
        <span style="color:var(--cyan);font-weight:600">Scanning with Claude AI...</span>
        <span style="color:var(--muted);font-size:.72rem;margin-top:.25rem">
          Entropy: ${entropy}/8.0 &nbsp;|&nbsp; ${trueType}
        </span>
      </div>
    </div>`;

  const truncated = content.slice(0, 4000);
  const highEntropy = parseFloat(entropy) > 6.5;

  const prompt = isBinary
    ? `You are a cybersecurity threat analyst performing REAL analysis on an uploaded binary file.

=== REAL FILE METRICS (computed from actual bytes) ===
Filename    : ${fname}
File size   : ${(size / 1024).toFixed(1)} KB
True type   : ${trueType}
Shannon entropy: ${entropy}/8.0  ${highEntropy ? '⚠ HIGH — likely packed, encrypted, or obfuscated' : '(normal range)'}
Magic bytes (hex, first 64 bytes): ${hexHeader}
${extMismatch ? `Extension mismatch: ${extMismatch}` : ''}

=== YOUR TASK ===
Using the REAL data above (not hypothetical), determine:
1. Does the magic byte signature match the claimed file extension?
2. Is the high entropy (${entropy}) evidence of packing, encryption, or obfuscation?
3. Is the true file type dangerous regardless of the extension?
4. Are there any red flags specific to THIS file's actual signatures?

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "CLEAN" | "SUSPICIOUS" | "MALICIOUS",
  "risk_score": <0-100>,
  "threats_found": {
    "malware": ["specific findings from the REAL metrics above"],
    "phishing": [],
    "ddos": []
  },
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "3-4 sentences referencing the ACTUAL entropy value (${entropy}), magic bytes, and true type (${trueType}) — be specific, not generic",
  "recommendations": ["concrete action steps"]
}`
    : `You are a cybersecurity threat analyst performing REAL analysis on an uploaded file.

=== REAL FILE METRICS (computed from actual bytes) ===
Filename    : ${fname}
File size   : ${(size / 1024).toFixed(1)} KB
True type   : ${trueType}
Shannon entropy: ${entropy}/8.0  ${highEntropy ? '⚠ HIGH — suggests base64/encoded payload inside text' : '(normal for plaintext)'}
Magic bytes (hex, first 64 bytes): ${hexHeader}
${extMismatch ? `Extension mismatch: ${extMismatch}` : ''}
${localFindings.length > 0 ? `Pre-scan findings (regex-matched in content): ${localFindings.join('; ')}` : 'Pre-scan: no obvious suspicious token patterns found by regex'}

=== FILE CONTENT (first 4000 chars) ===
${wasTruncated ? '[Truncated — only first 4000 of ' + (content.length) + ' chars shown]\n' : ''}---
${truncated}
---

=== YOUR TASK ===
Analyze the ACTUAL content above. Reference specific lines, patterns, or identifiers you actually see.
Do NOT give generic advice. Be precise: what exact code, URL, pattern, or string is suspicious?
Cross-reference the entropy (${entropy}) with the content — if you see base64 blobs, obfuscation, or encoded payloads, call them out specifically.

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "verdict": "CLEAN" | "SUSPICIOUS" | "MALICIOUS",
  "risk_score": <0-100>,
  "threats_found": {
    "malware": ["exact patterns found in content"],
    "phishing": ["exact patterns found in content"],
    "ddos": ["exact patterns found in content"]
  },
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "3-4 sentences about what you ACTUALLY found in this specific file — mention actual code, strings, or patterns you observed",
  "recommendations": ["concrete steps based on what was found"]
}`;

  try {
    const result = await analyzeWithAI(prompt);
    renderScanResult(result, fname, size, entropy, trueType, hexHeader, extMismatch, localFindings, wasTruncated);
  } catch (err) {
    showError('upload-result', null, err);
  }
}

function renderScanResult(r, origName, size, entropy, trueType, hexHeader, extMismatch, localFindings, wasTruncated) {
  const out = document.getElementById('upload-result');
  const scoreColor = r.risk_score < 25 ? 'var(--green)' : r.risk_score < 55 ? 'var(--orange)' : 'var(--red)';
  const cls  = r.verdict === 'CLEAN' ? 'result-safe' : r.verdict === 'SUSPICIOUS' ? 'result-warn' : 'result-danger';
  const icon = r.verdict === 'CLEAN' ? '✅' : r.verdict === 'SUSPICIOUS' ? '⚠️' : '🚨';
  const sevColor = { LOW: 'var(--green)', MEDIUM: 'var(--orange)', HIGH: 'var(--red)', CRITICAL: 'var(--red)' }[r.severity] || 'var(--muted)';
  const bar = Math.min(r.risk_score, 100);
  const entropyNum = parseFloat(entropy);
  const entropyColor = entropyNum > 6.5 ? 'var(--red)' : entropyNum > 4.5 ? 'var(--orange)' : 'var(--green)';

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

    <!-- Real file metrics panel -->
    <div style="background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:.75rem 1rem;margin-bottom:.85rem;font-family:var(--mono);font-size:.72rem;line-height:1.9">
      <div style="color:var(--cyan);font-weight:600;margin-bottom:.35rem;font-family:var(--font);font-size:.72rem;letter-spacing:1px">📊 REAL FILE METRICS</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:.1rem .75rem">
        <span style="color:var(--muted)">filename</span><span style="color:var(--text)">${origName}</span>
        <span style="color:var(--muted)">file size</span><span style="color:var(--text)">${(size/1024).toFixed(2)} KB ${wasTruncated ? '<span style="color:var(--orange)">(content truncated for AI)</span>' : ''}</span>
        <span style="color:var(--muted)">true type</span><span style="color:var(--cyan)">${trueType}</span>
        <span style="color:var(--muted)">entropy</span><span style="color:${entropyColor};font-weight:600">${entropy}/8.0 ${entropyNum > 6.5 ? '⚠ HIGH — packed/encrypted/obfuscated' : entropyNum > 4.5 ? '⚠ Moderate' : '✓ Normal'}</span>
        <span style="color:var(--muted)">magic bytes</span><span style="color:var(--text);word-break:break-all">${hexHeader}</span>
        ${extMismatch ? `<span style="color:var(--muted)">⚠ mismatch</span><span style="color:var(--red)">${extMismatch}</span>` : ''}
      </div>
    </div>

    ${localFindings.length > 0 ? `
    <div style="background:rgba(255,45,85,.07);border:1px solid rgba(255,45,85,.2);border-radius:8px;padding:.65rem 1rem;margin-bottom:.85rem">
      <div style="color:var(--red);font-size:.72rem;font-weight:600;letter-spacing:1px;margin-bottom:.4rem">🔎 PRE-SCAN REGEX MATCHES (found in actual content)</div>
      ${localFindings.map(f => `<div style="color:var(--orange);font-size:.75rem;margin:.15rem 0">⚠ ${f}</div>`).join('')}
    </div>` : ''}

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
