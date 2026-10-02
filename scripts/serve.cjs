const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const handler = require('../api/app');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 4173;
const files = new Set(['index.html', 'catalog.js', 'rebates.js', 'script.js', 'mobile.js', 'activity.js', 'styles.css', 'admin.html', 'admin.js', 'admin.css', 'sw.js', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']);
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + port);
  for (const header of config.headers[0].headers) res.setHeader(header.key, header.value);
  if (url.pathname === '/api/app') {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 12000) { res.writeHead(413); res.end(); return; } }
    try { req.body = body ? JSON.parse(body) : {}; } catch { res.writeHead(400); res.end(); return; }
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.json = value => res.end(JSON.stringify(value));
    await handler(req, res); return;
  }
  const relative = url.pathname === '/' ? 'index.html' : url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1);
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || (!files.has(relative) && !/^assets\/(icons|vendor)\/[a-zA-Z0-9_.-]+$/.test(relative)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('Car Loan MY preview: http://localhost:' + port + ' | Admin: http://localhost:' + port + '/admin'));
