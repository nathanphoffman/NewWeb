const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE = __dirname;
const PORT = 3000;

const MIME = {
  '.md':   'text/plain',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
};

function serve(res, filePath, data) {
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Content-Length': data.length,
  });
  res.end(data);
}

http.createServer((req, res) => {
  // serve only from simple-site/ — no fallback, no HTML shim
  // regular browsers get plain text or 404; Electron fetches main.md directly
  const rel = req.url === '/' ? '/main.md' : req.url;
  const filePath = path.join(SITE, rel);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    serve(res, filePath, data);
  });
}).listen(PORT, () => console.log(`simple-site → http://localhost:${PORT}`));
