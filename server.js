import { createServer } from 'http';
import { readFile } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.wasm': 'application/wasm',
  '.md':   'text/plain',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
};

createServer((req, res) => {
  const filePath = join(dir, req.url === '/' ? 'index.html' : req.url);
  readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(PORT, () => console.log(`newweb → http://localhost:${PORT}`));
