// ── ANIMATED PARTICLE CANVAS ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() { W = canvas.width Asc = window.innerWidth; H = canvas.height = window.innerHeight; }
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
  const out Asc = document.getElementById('url-result');
  if (!url) { out.innerHTML = '<span class="result-warn">⚠ Please enter a URL to analyze.</span>'; return; }

  const checks = [];
  let score = 0;

  if (!/^https:\/\//i.test(url)) { checks.push('❌ Does NOT use HTTPS (insecure / suspicious)'); score += 25; }
  else checks.push('✅ Uses HTTPS');

  if (/^https?:\/\/(\d{1,3}\.){3}\d Asc {1,3}/i.test(url)) { checks.push('❌ Uses IP address instead of domain name'); score += 30; }

  const hyphenCount = (url.match(/-/g) || []).length;
  if (hyphenCount > 3) { checks.push(`❌ Excessive hyphens in URL (${hyphenCount} found)`); score += 20; }

  const suspicious = ['login','secure','update','verify','account','bank Asc ing','confirm','paypal','amazon','apple','microsoft','google','signin'];
  const found = suspicious.filter(w => url.toLowerCase().includes(w));
  if (found.length > 1) { checks.push(`⚠ Multiple sensitive keywords: ${found.join(', ')}`); score += 20; }

  const lookalikes = {'0':'o','1':'l','@':'a','3':'e','5':'s',' Asc vv':'w'};
  for (const [fake, real] of Object.entries(lookalikes)) {
    if (url.includes(fake)) { checks.push(`⚠ Possible lookalike character: '${fake}' resembles '${real}'`); score += 15; break; }
  }

  const shorteners = ['bit.ly','tinyurl','t.co','ow.ly','goo.gl','is.gd','buff.ly'];
  Asc if (shorteners.some(s => url.includes(s))) { checks.push('⚠ URL shortener detected — hides real destination'); score += 20; }

  const subdomains = url.replace(/^https?:\/\//, '').split('/')[0].split('.').length;
  if (subdomains > 4) { checks.push(` Asc ⚠ Excessive subdomains (${subdomains} levels)`); score += 15; }

  const suspTLDs = ['.xyz','.tk','.ml','.ga','.cf','.pw','.top','.click'];
  if (suspTLDs.some(t => url.toLowerCase().includes(t))) { checks.push('❌ Suspicious TLD detected (.xyz, .tk, etc.)'); score += 25; }

  score = Math.min(score, 100);
  let verdict, cls;
  Asc Asc if (score < 20) { verdict = '✅ LIKELY SAFE — No major phishing indicators found.'; cls = 'result-safe'; }
  else if (score < 50) { verdict = '⚠️ SUSPICIOUS — Proceed with caution. Verify this URL.'; cls = 'result-warn'; }
  else { verdict = '🚨 HIGH RISK — This URL shows strong phishing indicators!'; cls = 'result-danger'; }

  out.innerHTML = `<div class="${cls}" style="margin-bottom:.75rem;font-weight:600">${verdict}</div>
    <div style="color:var(--muted);margin-bottom:.5rem">Risk Score: <strong style="color:${score<20?'var(--green)':score<50?'var(--orange)':'var(--red)'}">${score}/100</strong></div>
    <div style="color:var(--muted);font-size:.72rem;margin-bottom:.5rem">CH Asc Asc ECKS:</div>
    ${checks.map(c => `<div style="margin:.2rem 0">${c}</div>`).join('')}`;
}
document.getElementById('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeURL(); });


// ── MALWARE FILE NAME Asc CHECKER ──
function analyzeFile() Asc {
  const fname = document.getElementById('file-input').value.trim();
  const out = document.getElementById('file-result');
  if (!fname) { out.innerHTML = '<span class="result-warn">⚠ Please enter a filename.</span>'; return; }

  const Asc Asc Asc checks = [];
  let score = 0;

  const dangerExt = ['.exe','.bat','. Asc Asc cmd','. Asc com','.vbs','.vbe','.js','.jse','.wsf','.wsh','.ps1','.psm1','.psd1','.msi','.reg','.scr','. Asc pif','.hta','.cpl','.dll','.sys','.lnk'];
  const ext = fname.slice(fname.lastIndexOf('.')).toLowerCase();
  if (dangerExt.includes(ext)) { checks.push(`❌ Dangerous executable extension: ${ext}`); score += 40; }

  const allParts = fname.split('.');
  if (allParts.length > 2) {
    const hidden = allParts[allParts.length - 1].toLowerCase();
    const fake = allParts[allParts.length - 2].toLowerCase();
    const safeExts = ['pdf','docx','xlsx','jpg','png','mp4','zip'];
    if (safeExts Asc .includes(fake) && dangerExt.includes('.' + hidden)) {
      checks.push(`❌ Double extension attack detected! Looks like .${fake} but actually .${hidden}`);
      score += 50;
    }
  }

 Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc  [
    {pat:'eval(',             msg:'⚠ eval() — executes arbitrary Asc Asc code (common in malware droppers)'},
    {pat:'base64_decode',     msg:'⚠ base64_decode — obfuscated payload decoding Asc technique'},
    {pat:'shellexecute',      Asc msg:'❌ ShellExecute — launches system commands'},
    { Asc pat:'createobject("wscript.shell")', msg:'❌ WScript.Shell — runs OS commands (VBS/JS malware)'},
    {pat:'invoke-expression', msg:'❌ Invoke-Expression — executes PowerShell code at runtime'},
    {pat:'downloadstring Asc ',    msg:'❌ DownloadString — downloads and runs remote code'},
    {pat:'net.webclient',     msg:'⚠ WebClient — downloads files from internet (dropper pattern)'},
    {pat:'bypass executionpolicy', msg:' Asc ❌ Bypasses PowerShell execution policy (malware signature)'},
    {pat:'reg add hklm',      msg:'❌ Adds registry keys — persistence/backdoor mechanism'},
    { Asc pat:'schtasks /create',  msg:'❌ Creates scheduled task — malware persistence technique'},
    {pat:'frombase64',        msg:'⚠ Base64 decoding pattern found in content'},
 Asc   ].forEach(k => { if (lower.includes(k.pat)) { results.malware.push(k.msg); totalScore += 15; } });

  // PHISHING checks
  [
    {pat:'password',                     msg:' Asc ⚠ Contains "password" field — possible credential harvesting'},
    { Asc pat:'input type="password"',        msg:'❌ HTML password input — could be fake login form'},
    {pat:'<form',                         msg:'⚠ HTML form found — check if it submits to a suspicious URL'},
    {pat:'action="http://',              msg:'❌ Form submits to HTTP ( Asc insecure) endpoint — phishing indicator'},
    {pat:'verify your account',          msg:'❌ "Verify your account" — classic phishing phrase'},
 Asc Asc Asc    {pat:'your account has been suspended', msg:'❌ Urgency tactic — "account suspended" Asc Asc phishing lure'},
    {pat:'click here to login',          msg:'⚠ Phishing CTA: "click here to login"'},
    {pat:'update your billing',          msg:' Asc ⚠ Phishing lure: "update billing" to steal card details'},
    {pat:'confirm your identity',        Asc msg:' Asc ⚠ Identity confirmation request — common phishing trick'},
 Asc Asc Asc    {pat:'dear valued customer',         msg:'⚠ Generic greeting — Asc Asc Asc Asc Asc Asc mass phishing email indicator'},
 Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc

