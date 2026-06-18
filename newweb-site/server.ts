import { join, resolve, sep, dirname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const SITE_DIR   = import.meta.dir;
const STATIC_DIR = join(SITE_DIR, 'static');

interface ServerConfig {
  username: string;
  passwordHash: string; // SHA256(password) hex
}

const config: ServerConfig = await Bun.file(join(SITE_DIR, 'config.server.json')).json();

// ── helpers ──────────────────────────────────────────────────────────────────

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function verifyToken(username: string, token: string): boolean {
  if (username !== config.username) return false;
  const H   = config.passwordHash;
  const now = Math.floor(Date.now() / 1000 / 60);
  for (const m of [now - 1, now, now + 1]) {
    if (sha256(H + m.toString()) === token) return true;
  }
  return false;
}

function authenticated(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const token    = auth.slice(7);
  const username = req.headers.get('X-NW-Username') ?? '';
  return verifyToken(username, token);
}

function safeMdPath(raw: string): string | null {
  // Strip leading slash, force .md extension, block traversal
  const cleaned = raw.replace(/^\/+/, '');
  if (!cleaned.endsWith('.md')) return null;
  const full = resolve(join(SITE_DIR, cleaned));
  // Must stay within SITE_DIR and not touch static/ or config files
  if (!full.startsWith(SITE_DIR + sep)) return null;
  if (full.startsWith(STATIC_DIR)) return null;
  return full;
}

function json(body: object, status = 200): Response {
  return Response.json(body, { status });
}

// ── request handler ───────────────────────────────────────────────────────────

Bun.serve({
  port: 3000,

  async fetch(req) {
    const { pathname } = new URL(req.url);

    // ── POST /api/auth ───────────────────────────────────────────────────────
    if (pathname === '/api/auth' && req.method === 'POST') {
      const { username, token } = await req.json() as { username: string; token: string };
      if (verifyToken(username, token)) {
        return json({ success: true });
      }
      return json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // ── /api/file ────────────────────────────────────────────────────────────
    if (pathname === '/api/file') {
      if (!authenticated(req)) return json({ error: 'Unauthorized' }, 401);

      const body = await req.json() as { path: string; content?: string };
      const fullPath = safeMdPath(body.path ?? '');
      if (!fullPath) return json({ error: 'Invalid path — must be a .md file within the site' }, 400);

      // PUT — edit existing
      if (req.method === 'PUT') {
        if (!existsSync(fullPath)) return json({ error: 'File not found' }, 404);
        await Bun.write(fullPath, body.content ?? '');
        return json({ success: true, message: 'Post saved' });
      }

      // POST — create new
      if (req.method === 'POST') {
        if (existsSync(fullPath)) return json({ error: 'File already exists — use Edit to update it' }, 409);
        mkdirSync(dirname(fullPath), { recursive: true });
        await Bun.write(fullPath, body.content ?? '');
        return json({ success: true, message: `Created: ${body.path}` });
      }

      // DELETE
      if (req.method === 'DELETE') {
        if (!existsSync(fullPath)) return json({ error: 'File not found' }, 404);
        await unlink(fullPath);
        return json({ success: true, message: 'Deleted' });
      }
    }

    // ── static & content files ───────────────────────────────────────────────

    // Root → index.html
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(Bun.file(join(STATIC_DIR, 'index.html')));
    }

    // newweb.config.json — served from site root (no secrets)
    if (pathname === '/newweb.config.json') {
      return new Response(Bun.file(join(SITE_DIR, 'newweb.config.json')));
    }

    // Markdown content files — served from SITE_DIR
    if (pathname.endsWith('.md')) {
      const fullPath = resolve(join(SITE_DIR, pathname.replace(/^\/+/, '')));
      if (!fullPath.startsWith(SITE_DIR + sep)) return new Response('Forbidden', { status: 403 });
      const file = Bun.file(fullPath);
      if (!await file.exists()) return new Response('Not found', { status: 404 });
      return new Response(file, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
    }

    // Engine static files (editor bundle, wasm, fonts, etc.)
    const staticPath = resolve(join(STATIC_DIR, pathname.replace(/^\/+/, '')));
    if (!staticPath.startsWith(STATIC_DIR + sep)) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(staticPath);
    if (await file.exists()) return new Response(file);

    return new Response('Not found', { status: 404 });
  },
});

console.log('newweb-site → http://localhost:3000');
