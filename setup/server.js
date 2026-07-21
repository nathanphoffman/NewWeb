import { statSync } from 'fs';
import { extname, join, normalize } from 'path';

const dir = import.meta.dir;
const PORT = 8080;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.wasm': 'application/wasm',
  '.md':   'text/plain',
  '.svg':  'image/svg+xml',
};

// true for a real top-level browser navigation (address bar, link click, refresh) —
// false for the SPA's own fetch() calls, which never set Sec-Fetch-Mode: navigate
// and don't ask for text/html
function isNavigationRequest(req) {
  const mode = req.headers.get('sec-fetch-mode');
  if (mode) return mode === 'navigate';
  return (req.headers.get('accept') || '').includes('text/html');
}

function fileType(path) {
  try {
    const stat = statSync(path);
    return stat.isFile() ? 'file' : stat.isDirectory() ? 'dir' : null;
  } catch {
    return null;
  }
}

function serveFile(path) {
  return new Response(Bun.file(path), {
    headers: {
      'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}

function notFound() {
  return new Response('not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

    // resolve within `dir` only — reject any path that escapes it (e.g. "..")
    const filePath = normalize(join(dir, pathname));
    if (filePath !== dir && !filePath.startsWith(dir + '/')) {
      return notFound();
    }

    if (pathname === '/') return serveFile(join(dir, 'index.html'));

    const navigating = isNavigationRequest(req);

    // a top-level navigation to a markdown page — whether the URL has the .md extension
    // or not — always gets the SPA shell, never the raw file or an HTTP redirect. The
    // client's own router rewrites the address bar to the extension-less form via
    // history.replaceState, so there's no redirect for a browser/CDN to cache wrong.
    const mdExists = pathname.endsWith('.md') ? fileType(filePath) === 'file' : fileType(filePath + '.md') === 'file';
    if (navigating && mdExists) return serveFile(join(dir, 'index.html'));

    // real file on disk (assets, or the SPA's own fetch() of a .md file) — serve as-is
    if (fileType(filePath) === 'file') return serveFile(filePath);

    return notFound();
  },
});

console.log(`newweb → ${server.url}`);
