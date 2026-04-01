// ── DDOS SIMULATOR ──

const dc = document.getElementById('ddos-canvas');
const dctx = dc.getContext('2d');
let simState = 'idle'; // idle | attacking | defended
let simBots = [], simPackets = [], simRps = 0, simLoad = 0, simBlocked = 0, simBotCount = 0;
let simInterval = null;

function resizeDC() {
  dc.width = dc.offsetWidth;
  dc.height = dc.offsetHeight || 300;
}
resizeDC();
window.addEventListener('resize', resizeDC);

const SERVER = { x: 0, y: 0, w: 80, h: 50 };

function simLog(msg, cls) {
  const log = document.getElementById('sim-log');
  const d = document.createElement('div');
  d.className = cls || 'log-info';
  d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function startAttack() {
  if (simState === 'attacking') return;
  simState = 'attacking';
  simBotCount = 20;
  simBlocked = 0;
  simLog('⚡ ATTACK STARTED: 20 bots flooding server!', 'log-attack');
  simLog('⚠ Sending rapid HTTP GET requests from multiple IPs...', 'log-attack');
  clearInterval(simInterval);
  simInterval = setInterval(simTick, 50);
}

function applyDefense() {
  if (simState === 'idle') { simLog('Start an attack first!', 'log-info'); return; }
  simState = 'defended';
  simLog('🛡️ DEFENSE APPLIED: Rate limiting + IP blacklist active!', 'log-defend');
  simLog('✅ Cloudflare WAF blocking suspicious IPs...', 'log-defend');
  simLog('✅ SYN cookies enabled. Server recovering...', 'log-defend');
}

function resetSim() {
  simState = 'idle'; simBots = []; simPackets = [];
  simRps = 0; simLoad = 0; simBlocked = 0; simBotCount = 0;
  clearInterval(simInterval); simInterval = null;
  document.getElementById('sim-rps').textContent = '0';
  document.getElementById('sim-bots').textContent = '0';
  document.getElementById('sim-load').textContent = '0%';
  document.getElementById('sim-blocked').textContent = '0';
  document.getElementById('sim-server-status').textContent = 'ONLINE ✅';
  document.getElementById('sim-server-status').style.color = 'var(--green)';
  document.getElementById('sim-log').innerHTML = '<div class="log-info">// Simulator reset. Ready.</div>';
  dctx.clearRect(0, 0, dc.width, dc.height);
}

let simFrame = 0;
function simTick() {
  simFrame++;
  const W = dc.width, H = dc.height;
  SERVER.x = W - 120; SERVER.y = H / 2 - 25;

  if (simState === 'attacking') {
    for (let i = 0; i < 6; i++) {
      simPackets.push({
        x: Math.random() * (W * 0.3),
        y: Math.random() * H,
        tx: SERVER.x, ty: SERVER.y + SERVER.h / 2,
        speed: 4 + Math.random() * 4,
        col: Math.random() < 0.2 ? '#ff8c42' : '#ff2d55',
        blocked: false
      });
    }
    simRps = Math.min(simRps + 8, 320);
    simLoad = Math.min(simLoad + 2, 100);
  } else if (simState === 'defended') {
    if (Math.random() < 0.3) {
      simPackets.push({
        x: Math.random() * (W * 0.3), y: Math.random() * H,
        tx: SERVER.x, ty: SERVER.y + SERVER.h / 2,
        speed: 4 + Math.random() * 3, col: '#ff2d55', blocked: false
      });
    }
    simRps = Math.max(simRps - 15, 0);
    simLoad = Math.max(simLoad - 5, 0);
  } else {
    simRps = Math.max(simRps - 20, 0);
    simLoad = Math.max(simLoad - 10, 0);
  }

  const wallX = simState === 'defended' ? SERVER.x - 60 : SERVER.x;
  simPackets = simPackets.filter(p => {
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < p.speed) { return false; }
    if (simState === 'defended' && p.x > wallX && !p.blocked) {
      p.blocked = true; simBlocked++; return false;
    }
    p.x += (dx / dist) * p.speed;
    p.y += (dy / dist) * p.speed;
    return true;
  });

  // draw
  dctx.clearRect(0, 0, W, H);
  dctx.strokeStyle = 'rgba(255,255,255,0.03)'; dctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 40) { dctx.beginPath(); dctx.moveTo(gx, 0); dctx.lineTo(gx, H); dctx.stroke(); }
  for (let gy = 0; gy < H; gy += 40) { dctx.beginPath(); dctx.moveTo(0, gy); dctx.lineTo(W, gy); dctx.stroke(); }

  if (simState === 'defended') {
    dctx.strokeStyle = 'rgba(0,255,136,0.5)'; dctx.lineWidth = 2;
    dctx.setLineDash([6, 4]);
    dctx.beginPath(); dctx.moveTo(wallX, 0); dctx.lineTo(wallX, H); dctx.stroke();
    dctx.setLineDash([]);
    dctx.fillStyle = 'rgba(0,255,136,0.08)'; dctx.fillRect(wallX, 0, W - wallX, H);
    dctx.fillStyle = '#00ff88'; dctx.font = '11px JetBrains Mono,monospace';
    dctx.fillText('🛡 WAF / Rate Limiter', wallX + 6, 18);
  }

  if (simState !== 'idle') {
    const botPositions = [{x:40,y:50},{x:20,y:110},{x:60,y:170},{x:30,y:230},{x:50,y:270},{x:10,y:80},{x:70,y:145},{x:25,y:200}];
    botPositions.forEach(b => {
      dctx.beginPath(); dctx.arc(b.x, Math.min(b.y, H - 10), 9, 0, Math.PI * 2);
      dctx.fillStyle = simState === 'defended' ? 'rgba(255,45,85,0.4)' : 'rgba(255,45,85,0.9)';
      dctx.fill();
      dctx.fillStyle = '#fff'; dctx.font = '9px Arial';
      dctx.fillText('🤖', b.x - 7, Math.min(b.y, H - 5));
    });
    dctx.fillStyle = 'rgba(255,45,85,0.7)'; dctx.font = '11px JetBrains Mono,monospace';
    dctx.fillText('BOTNET', 5, H - 8);
  }

  simPackets.forEach(p => {
    dctx.beginPath(); dctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    dctx.fillStyle = p.col;
    dctx.shadowBlur = 8; dctx.shadowColor = p.col;
    dctx.fill(); dctx.shadowBlur = 0;
  });

  const sCol = simLoad > 85 ? '#ff2d55' : simLoad > 50 ? '#ff8c42' : '#00ff88';
  dctx.fillStyle = 'rgba(13,21,38,0.9)';
  dctx.strokeStyle = sCol; dctx.lineWidth = 2;
  dctx.beginPath(); dctx.roundRect(SERVER.x, SERVER.y, SERVER.w, SERVER.h, 8);
  dctx.fill(); dctx.stroke();
  dctx.shadowBlur = 12; dctx.shadowColor = sCol; dctx.stroke(); dctx.shadowBlur = 0;
  dctx.fillStyle = sCol; dctx.font = 'bold 11px Inter,sans-serif';
  dctx.fillText('SERVER', SERVER.x + 14, SERVER.y + 22);
  dctx.fillStyle = sCol; dctx.font = '9px JetBrains Mono,monospace';
  dctx.fillText(simLoad + '%', SERVER.x + 22, SERVER.y + 38);

  const serverStatus = document.getElementById('sim-server-status');
  if (simLoad >= 100) {
    serverStatus.textContent = 'OFFLINE ❌'; serverStatus.style.color = 'var(--red)';
  } else if (simLoad > 60) {
    serverStatus.textContent = 'OVERLOADED ⚠️'; serverStatus.style.color = 'var(--orange)';
  } else {
    serverStatus.textContent = 'ONLINE ✅'; serverStatus.style.color = 'var(--green)';
  }
  document.getElementById('sim-rps').textContent = simRps;
  document.getElementById('sim-bots').textContent = simState !== 'idle' ? simBotCount : 0;
  document.getElementById('sim-load').textContent = simLoad + '%';
  document.getElementById('sim-blocked').textContent = simBlocked;
}

// idle canvas draw loop
(function idleFrame() {
  if (simState === 'idle' && !simInterval) {
    const W = dc.width, H = dc.height;
    dctx.clearRect(0, 0, W, H);
    dctx.strokeStyle = 'rgba(255,255,255,0.03)'; dctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { dctx.beginPath(); dctx.moveTo(gx,0); dctx.lineTo(gx,H); dctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { dctx.beginPath(); dctx.moveTo(0,gy); dctx.lineTo(W,gy); dctx.stroke(); }
    SERVER.x = W - 120; SERVER.y = H/2 - 25;
    dctx.fillStyle = 'rgba(13,21,38,0.9)'; dctx.strokeStyle = '#00ff88'; dctx.lineWidth = 2;
    dctx.beginPath(); dctx.roundRect(SERVER.x, SERVER.y, 80, 50, 8); dctx.fill(); dctx.stroke();
    dctx.fillStyle = '#00ff88'; dctx.font = 'bold 11px Inter,sans-serif';
    dctx.fillText('SERVER', SERVER.x + 14, SERVER.y + 22);
    dctx.fillStyle = '#00ff88'; dctx.font = '9px JetBrains Mono';
    dctx.fillText('0%', SERVER.x + 28, SERVER.y + 38);
    dctx.fillStyle = 'rgba(0,212,255,0.5)'; dctx.font = '13px Inter';
    dctx.fillText('⚡ Click "Launch Attack" to start simulation', W/2 - 160, H/2);
  }
  requestAnimationFrame(idleFrame);
})();
