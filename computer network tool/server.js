// ── CyberShield Local Development Server ──
// Run: node server.js
// Set your key: $env:ANTHROPIC_API_KEY="sk-ant-..."   (PowerShell)
//               set ANTHROPIC_API_KEY=sk-ant-...       (CMD)

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env file manually if it exists (so we don't need npm install dotenv)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (err) {
  // Ignore error if .env is missing or unreadable
}

const PORT = 3000;
const BASE_DIR = __dirname;

// MIME types for static file serving
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;

  // ── CORS headers ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── API Proxy Route ──
  if (pathname === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }

      const { prompt } = parsed;
      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'No prompt provided' }));
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: 'ANTHROPIC_API_KEY not set. Run: $env:ANTHROPIC_API_KEY="sk-ant-..."',
        }));
      }

      const payload = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      };

      const apiReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', c => data += c);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }

  // ── Static File Server ──
  let filePath = path.join(BASE_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n🛡️  CyberShield Local Server');
  console.log('─'.repeat(40));
  console.log(`   URL   →  http://localhost:${PORT}`);
  console.log(`   API   →  http://localhost:${PORT}/api/analyze`);
  console.log('─'.repeat(40));

  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (hasKey) {
    console.log('   ✅  ANTHROPIC_API_KEY is set — AI tools are ready!\n');
  } else {
    console.log('   ⚠️  ANTHROPIC_API_KEY is NOT set!');
    console.log('   To fix this locally:');
    console.log('   1. Open the .env file in your code editor.');
    console.log('   2. Add your key: ANTHROPIC_API_KEY=sk-ant-...');
    console.log('   3. Restart this server (Ctrl+C, then node server.js)\n');
  }
});
