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


// ── PHISHING URL ANALYZER ──
function analyzeURL() {
  const url = document.getElementById('url-input').value.trim();
  const out = document.getElementById('url-result');
  if (!url) { out.innerHTML = '<span class="result-warn">⚠ Please enter a URL to analyze.</span>'; return; }

  const checks = [];
  let score = 0;

  if (!/^https:\/\//i.test(url)) { checks.push('❌ Does NOT use HTTPS (insecure / suspicious)'); score += 25; }
  else checks.push('✅ Uses HTTPS');

  if (/^https?:\/\/(\d{1,3}\.){3}\d{1,3}/i.test(url)) { checks.push('❌ Uses IP address instead of domain name'); score += 30; }

  const hyphenCount = (url.match(/-/g) || []).length;
  if (hyphenCount > 3) { checks.push(`❌ Excessive hyphens in URL (${hyphenCount} found)`); score += 20; }

  const suspicious = ['login','secure','update','verify','account','banking','confirm','paypal','amazon','apple','microsoft','google','signin'];
  const found = suspicious.filter(w => url.toLowerCase().includes(w));
  if (found.length > 1) { checks.push(`⚠ Multiple sensitive keywords: ${found.join(', ')}`); score += 20; }

  const lookalikes = {'0':'o','1':'l','@':'a','3':'e','5':'s','vv':'w'};
  for (const [fake, real] of Object.entries(lookalikes)) {
    if (url.includes(fake)) { checks.push(`⚠ Possible lookalike character: '${fake}' resembles '${real}'`); score += 15; break; }
  }

  const shorteners = ['bit.ly','tinyurl','t.co','ow.ly','goo.gl','is.gd','buff.ly'];
  if (shorteners.some(s => url.includes(s))) { checks.push('⚠ URL shortener detected — hides real destination'); score += 20; }

  const subdomains = url.replace(/^https?:\/\//, '').split('/')[0].split('.').length;
  if (subdomains > 4) { checks.push(`⚠ Excessive subdomains (${subdomains} levels)`); score += 15; }

  const suspTLDs = ['.xyz','.tk','.ml','.ga','.cf','.pw','.top','.click'];
  if (suspTLDs.some(t => url.toLowerCase().includes(t))) { checks.push('❌ Suspicious TLD detected (.xyz, .tk, etc.)'); score += 25; }

  score = Math.min(score, 100);
  let verdict, cls;
  if (score < 20) { verdict = '✅ LIKELY SAFE — No major phishing indicators found.'; cls = 'result-safe'; }
  else if (score < 50) { verdict = '⚠️ SUSPICIOUS — Proceed with caution. Verify this URL.'; cls = 'result-warn'; }
  else { verdict = '🚨 HIGH RISK — This URL shows strong phishing indicators!'; cls = 'result-danger'; }

  out.innerHTML = `<div class="${cls}" style="margin-bottom:.75rem;font-weight:600">${verdict}</div>
    <div style="color:var(--muted);margin-bottom:.5rem">Risk Score: <strong style="color:${score<20?'var(--green)':score<50?'var(--orange)':'var(--red)'}">${score}/100</strong></div>
    <div style="color:var(--muted);font-size:.72rem;margin-bottom:.5rem">CHECKS:</div>
    ${checks.map(c => `<div style="margin:.2rem 0">${c}</div>`).join('')}`;
}
document.getElementById('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeURL(); });


// ── MALWARE FILE NAME CHECKER ──
function analyzeFile() {
  const fname = document.getElementById('file-input').value.trim();
  const out = document.getElementById('file-result');
  if (!fname) { out.innerHTML = '<span class="result-warn">⚠ Please enter a filename.</span>'; return; }

  const checks = [];
  let score = 0;

  const dangerExt = ['.exe','.bat','.cmd','.com','.vbs','.vbe','.js','.jse','.wsf','.wsh','.ps1','.psm1','.psd1','.msi','.reg','.scr','.pif','.hta','.cpl','.dll','.sys','.lnk'];
  const ext = fname.slice(fname.lastIndexOf('.')).toLowerCase();
  if (dangerExt.includes(ext)) { checks.push(`❌ Dangerous executable extension: ${ext}`); score += 40; }

  const allParts = fname.split('.');
  if (allParts.length > 2) {
    const hidden = allParts[allParts.length - 1].toLowerCase();
    const fake = allParts[allParts.length - 2].toLowerCase();
    const safeExts = ['pdf','docx','xlsx','jpg','png','mp4','zip'];
    if (safeExts.includes(fake) && dangerExt.includes('.' + hidden)) {
      checks.push(`❌ Double extension attack detected! Looks like .${fake} but actually .${hidden}`);
      score += 50;
    }
  }

  const malwareNames = ['setup','install','crack','keygen','patch','loader','hack','bypass','cheat','warez','free-download','invoice_'];
  const lower = fname.toLowerCase();
  const mFound = malwareNames.filter(m => lower.includes(m));
  if (mFound.length > 0) { checks.push(`⚠ Suspicious filename keyword: ${mFound.join(', ')}`); score += 20; }

  if (/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/.test(fname)) {
    checks.push('❌ Unicode direction override characters detected (RTL trick)'); score += 60;
  }

  if (/\s+\.\w+$/.test(fname)) { checks.push('⚠ Spaces before file extension — obfuscation detected'); score += 25; }

  if (checks.length === 0) checks.push('✅ No suspicious patterns detected in filename');

  score = Math.min(score, 100);
  let verdict, cls;
  if (score < 20) { verdict = '✅ LIKELY SAFE — No malware indicators found.'; cls = 'result-safe'; }
  else if (score < 50) { verdict = '⚠️ SUSPICIOUS — Treat this file with caution.'; cls = 'result-warn'; }
  else { verdict = '🚨 HIGH RISK — This filename shows strong malware indicators!'; cls = 'result-danger'; }

  out.innerHTML = `<div class="${cls}" style="margin-bottom:.75rem;font-weight:600">${verdict}</div>
    <div style="color:var(--muted);margin-bottom:.5rem">Risk Score: <strong style="color:${score<20?'var(--green)':score<50?'var(--orange)':'var(--red)'}">${score}/100</strong></div>
    <div style="color:var(--muted);font-size:.72rem;margin-bottom:.5rem">CHECKS:</div>
    ${checks.map(c => `<div style="margin:.2rem 0">${c}</div>`).join('')}`;
}
document.getElementById('file-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeFile(); });


// ── FILE UPLOAD SCANNER ──
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) readAndScan(file);
});

function scanUploadedFile(input) {
  const file = input.files[0];
  if (file) readAndScan(file);
}

function readAndScan(file) {
  const out = document.getElementById('upload-result');
  out.innerHTML = '<span style="color:var(--cyan)">⏳ Scanning file contents...</span>';

  // Binary files CANNOT be read as text — check by extension first
  const binaryExts = ['.exe','.dll','.sys','.bin','.com','.scr','.pif',
                      '.msi','.iso','.img','.dmg','.so','.dylib','.class',
                      '.jar','.apk','.elf','.o','.obj','.lib','.a','.rpm','.deb'];
  const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isBinary = binaryExts.includes(fileExt) || file.size > 2 * 1024 * 1024;

  if (isBinary) {
    // Skip FileReader — scan by filename/extension only
    scanContent(file.name, '', file.name, file.size);
    return;
  }

  const reader = new FileReader();
  reader.onload = e => scanContent(file.name, e.target.result, file.name, file.size);
  reader.onerror = () => { out.innerHTML = '<span class="result-warn">⚠ Could not read file content.</span>'; };
  reader.readAsText(file);
}

function scanContent(fname, content, origName, size) {
  const out = document.getElementById('upload-result');
  const lower = content.toLowerCase();
  const nameLow = fname.toLowerCase();
  const results = { malware: [], phishing: [], ddos: [] };
  let totalScore = 0;

  // MALWARE checks
  const dangerExts = ['.exe','.bat','.cmd','.vbs','.ps1','.scr','.pif','.hta','.dll','.sys','.lnk','.msi','.reg'];
  const ext = nameLow.slice(nameLow.lastIndexOf('.'));
  if (dangerExts.includes(ext)) { results.malware.push(`❌ Dangerous file extension: ${ext}`); totalScore += 35; }

  const nameParts = nameLow.split('.');
  if (nameParts.length > 2) {
    const hidden = nameParts[nameParts.length - 1], fake = nameParts[nameParts.length - 2];
    const safeE = ['pdf','docx','xlsx','jpg','png','zip','mp4'];
    if (safeE.includes(fake) && dangerExts.includes('.' + hidden)) {
      results.malware.push(`❌ Double extension: .${fake}.${hidden} (disguised executable)`); totalScore += 50;
    }
  }

  [
    {pat:'eval(',             msg:'⚠ eval() — executes arbitrary code (common in malware droppers)'},
    {pat:'base64_decode',     msg:'⚠ base64_decode — obfuscated payload decoding technique'},
    {pat:'shellexecute',      msg:'❌ ShellExecute — launches system commands'},
    {pat:'createobject("wscript.shell")', msg:'❌ WScript.Shell — runs OS commands (VBS/JS malware)'},
    {pat:'invoke-expression', msg:'❌ Invoke-Expression — executes PowerShell code at runtime'},
    {pat:'downloadstring',    msg:'❌ DownloadString — downloads and runs remote code'},
    {pat:'net.webclient',     msg:'⚠ WebClient — downloads files from internet (dropper pattern)'},
    {pat:'bypass executionpolicy', msg:'❌ Bypasses PowerShell execution policy (malware signature)'},
    {pat:'reg add hklm',      msg:'❌ Adds registry keys — persistence/backdoor mechanism'},
    {pat:'schtasks /create',  msg:'❌ Creates scheduled task — malware persistence technique'},
    {pat:'frombase64',        msg:'⚠ Base64 decoding pattern found in content'},
  ].forEach(k => { if (lower.includes(k.pat)) { results.malware.push(k.msg); totalScore += 15; } });

  // PHISHING checks
  [
    {pat:'password',                     msg:'⚠ Contains "password" field — possible credential harvesting'},
    {pat:'input type="password"',        msg:'❌ HTML password input — could be fake login form'},
    {pat:'<form',                         msg:'⚠ HTML form found — check if it submits to a suspicious URL'},
    {pat:'action="http://',              msg:'❌ Form submits to HTTP (insecure) endpoint — phishing indicator'},
    {pat:'verify your account',          msg:'❌ "Verify your account" — classic phishing phrase'},
    {pat:'your account has been suspended', msg:'❌ Urgency tactic — "account suspended" phishing lure'},
    {pat:'click here to login',          msg:'⚠ Phishing CTA: "click here to login"'},
    {pat:'update your billing',          msg:'⚠ Phishing lure: "update billing" to steal card details'},
    {pat:'confirm your identity',        msg:'⚠ Identity confirmation request — common phishing trick'},
    {pat:'dear valued customer',         msg:'⚠ Generic greeting — mass phishing email indicator'},
    {pat:'win a prize',                  msg:'⚠ Prize scam — social engineering phishing lure'},
    {pat:'paypal',                       msg:'⚠ PayPal mentioned — frequently impersonated in phishing'},
  ].forEach(k => { if (lower.includes(k.pat)) { results.phishing.push(k.msg); totalScore += 12; } });

  // DDOS checks
  [
    {pat:'socket.connect',   msg:'⚠ socket.connect — network flooding pattern'},
    {pat:'threading.thread', msg:'⚠ Multi-threading — used in DDoS tools to multiply requests'},
    {pat:'while true:',      msg:'⚠ Infinite loop — potential flood loop structure'},
    {pat:'while(true)',      msg:'⚠ Infinite loop — potential flood loop structure'},
    {pat:'time.sleep(0.00',  msg:'⚠ Sleep(0.001) — high-rate request loop signature'},
    {pat:'sock.send',        msg:'⚠ sock.send in loop — packet flooding signature'},
    {pat:'syn flood',        msg:'❌ "SYN flood" explicitly mentioned'},
    {pat:'ddos',             msg:'⚠ "ddos" mentioned in file content'},
    {pat:'botnet',           msg:'❌ "botnet" keyword found — DDoS coordination'},
    {pat:'flood(',           msg:'⚠ flood() function — DDoS tool pattern'},
    {pat:'num_threads',      msg:'⚠ Thread count variable — high-volume request generator'},
    {pat:'http flood',       msg:'❌ HTTP flood pattern mentioned'},
  ].forEach(k => { if (lower.includes(k.pat)) { results.ddos.push(k.msg); totalScore += 10; } });

  const clampScore = Math.min(totalScore, 100);
  const hasThreats = results.malware.length + results.phishing.length + results.ddos.length > 0;

  let verdict, vClass;
  if (clampScore === 0)       { verdict = '✅ CLEAN — No threat signatures found in this file.';       vClass = 'result-safe'; }
  else if (clampScore < 25)   { verdict = '⚠️ LOW RISK — Minor indicators. Could be legitimate code.'; vClass = 'result-warn'; }
  else if (clampScore < 55)   { verdict = '🚨 SUSPICIOUS — Multiple threat patterns detected!';        vClass = 'result-warn'; }
  else                        { verdict = '🚨 HIGH RISK — Strong threat signatures found!';            vClass = 'result-danger'; }

  const badges = [
    results.malware.length  > 0 ? `<span class="badge malware">🦠 Malware (${results.malware.length})</span>`   : '',
    results.phishing.length > 0 ? `<span class="badge phishing">🎣 Phishing (${results.phishing.length})</span>` : '',
    results.ddos.length     > 0 ? `<span class="badge ddos">💥 DDoS (${results.ddos.length})</span>`            : '',
    !hasThreats ? '<span class="badge safe">✅ Safe</span>' : ''
  ].filter(Boolean).join('');

  const section = (title, items, col) => items.length === 0 ? '' : `
    <div style="margin-top:.75rem">
      <div style="color:${col};font-weight:600;margin-bottom:.35rem">${title} (${items.length} found)</div>
      ${items.map(i => `<div style="margin:.15rem 0;color:var(--text)">${i}</div>`).join('')}
    </div>`;

  out.innerHTML = `
    <div class="${vClass}" style="font-weight:700;font-size:.9rem;margin-bottom:.75rem">${verdict}</div>
    <div style="color:var(--muted);font-size:.78rem;margin-bottom:.5rem">📄 ${origName} &nbsp;|&nbsp; ${(size/1024).toFixed(1)} KB &nbsp;|&nbsp; Risk Score: <strong style="color:${clampScore<25?'var(--green)':clampScore<55?'var(--orange)':'var(--red)'}">${clampScore}/100</strong></div>
    <div class="scan-badges">${badges}</div>
    ${section('🦠 Malware Indicators',   results.malware,   'var(--red)')}
    ${section('🎣 Phishing Indicators',  results.phishing,  'var(--orange)')}
    ${section('💥 DDoS Indicators',      results.ddos,      'var(--cyan)')}
    ${!hasThreats ? '<div style="color:var(--green);margin-top:.5rem">✅ No suspicious content patterns detected in file body.</div>' : ''}
  `;
}
