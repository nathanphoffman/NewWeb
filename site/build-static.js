// Statically generates a pre-rendered copy of the site into ./static — one real .html
// file per .md file, using the same WASM markdown renderer the client uses. The rest of
// the project (assets, the .md files themselves, the wasm engine) is copied alongside so
// the folder is a self-contained, drop-anywhere static site: client-side navigation after
// the first load still works exactly as it does today, since it still fetches raw .md
// files and renders them the same way it always has. Not wired into server.js or any
// deploy path — whether/how to serve ./static is entirely up to the person deploying.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync, existsSync, rmSync } from 'fs';
import { join, dirname, relative, extname, sep } from 'path';
import { pathToFileURL } from 'url';

const projectRoot = process.cwd();
const OUT_DIR = join(projectRoot, 'static');

// top-level entries never walked for content or copied into static/: build output,
// dependency/VCS dirs, and wasm script source (not needed to serve the site — see README's
// "Static hosting" section, which only requires index.html + the compiled wasm + .md files)
const EXCLUDE = new Set(['static', 'node_modules', '.git', 'src', 'setup']);

const engineJsPath = join(projectRoot, 'engine', 'build', 'pkg', 'engine.js');
const engineWasmPath = join(projectRoot, 'engine', 'build', 'pkg', 'engine_bg.wasm');
if (!existsSync(engineJsPath) || !existsSync(engineWasmPath)) {
  console.error('✗ engine/build/pkg/engine_bg.wasm not found — build the engine first (see README).');
  process.exit(1);
}

const { initSync, render } = await import(pathToFileURL(engineJsPath).href);
initSync({ module: readFileSync(engineWasmPath) });

const shellPath = join(projectRoot, 'index.html');
if (!existsSync(shellPath)) {
  console.error('✗ index.html not found in ' + projectRoot);
  process.exit(1);
}
const shell = readFileSync(shellPath, 'utf8');
const defaultTitle = (shell.match(/<title>([^<]*)<\/title>/) ?? [, 'NewWeb'])[1];

// ---- markdown pipeline (mirrors engine/src/include.ts + the wasm render step; the
// directive/rewrite rules here must stay in sync with those files by hand, since this
// script runs outside the browser and can't import browser-targeted TS directly) ----

function toRootRelative(path) {
  if (path.startsWith('/') || /^(https?:|data:)/.test(path)) return path;
  return `/${path}`;
}

// mirrors fetch()'s behavior of resolving (not throwing) on a missing file, so a stale/example
// include reference degrades the same way here as it does for the client's own fetch-based include
function readMd(rootRelativeUrl) {
  const p = join(projectRoot, toRootRelative(rootRelativeUrl).slice(1));
  try {
    return readFileSync(p, 'utf8');
  } catch {
    console.warn(`  ⚠ missing referenced file: ${rootRelativeUrl}`);
    return '';
  }
}

function parseIncludeDirective(body) {
  const files = [];
  let sortMarker = null, sortDir = 'asc', limitTo = null;
  for (const part of body.split(',')) {
    const token = part.trim();
    if (/^sort_dir\s*:/i.test(token)) {
      if (token.replace(/^sort_dir\s*:/i, '').trim().toLowerCase() === 'desc') sortDir = 'desc';
    } else if (/^sort\s*:/i.test(token)) {
      sortMarker = token.replace(/^sort\s*:/i, '').trim().replace(/^["']|["']$/g, '');
    } else if (/^limit_to\s*:/i.test(token)) {
      const n = parseInt(token.replace(/^limit_to\s*:/i, '').trim(), 10);
      if (!isNaN(n)) limitTo = n;
    } else if (token) {
      files.push(token);
    }
  }
  return { files, sortMarker, sortDir, limitTo };
}

function splitIntoEntries(content, marker) {
  const lines = content.split('\n');
  const isHeadingMarker = marker === '#';
  const boundaries = [];
  lines.forEach((line, i) => {
    if (isHeadingMarker) {
      const m = line.match(/^#(?!#)\s+(.+)$/);
      if (m) boundaries.push({ index: i, key: m[1].trim() });
    } else {
      const stripped = line.trim().replace(/^<!--\s*/, '').replace(/\s*-->$/, '').trim();
      if (stripped.startsWith(marker)) boundaries.push({ index: i, key: stripped.slice(marker.length).trim() });
    }
  });
  return boundaries.map((b, i) => {
    const end = i + 1 < boundaries.length ? boundaries[i + 1].index : lines.length;
    return { key: b.key, text: lines.slice(b.index, end).join('\n').trim() };
  });
}

function processIncludes(raw, depth = 0) {
  const pattern = /<!--\s*include\s*:\s*(.+?)\s*-->/g;
  const matches = [...raw.matchAll(pattern)];
  if (matches.length === 0) return raw;

  const directives = matches.map(m => parseIncludeDirective(m[1]));
  const contentMap = new Map();
  for (const directive of directives) {
    for (const url of directive.files) {
      if (contentMap.has(url)) continue;
      let text = readMd(url);
      if (depth === 0 && /<!--\s*include\s*:\s*(.+?)\s*-->/.test(text)) text = processIncludes(text, depth + 1);
      contentMap.set(url, text);
    }
  }

  let i = 0;
  return raw.replace(pattern, () => {
    const directive = directives[i++];
    const fileContents = directive.files.map(f => contentMap.get(f) ?? '');
    if (!directive.sortMarker) return fileContents.join('\n\n');
    const entries = fileContents.flatMap(c => splitIntoEntries(c, directive.sortMarker));
    entries.sort((a, b) => a.key.localeCompare(b.key));
    if (directive.sortDir === 'desc') entries.reverse();
    const limited = directive.limitTo != null ? entries.slice(0, directive.limitTo) : entries;
    return limited.map(e => e.text).join('\n\n');
  });
}

function extractTitle(md) {
  const m = md.match(/<!--\s*title\s*:\s*(.+?)\s*-->/i);
  return m ? m[1] : defaultTitle;
}

function extractLogo(md) {
  const m = md.match(/<!--\s*\[([^\]]+)\]\(([^)]+)\)\s*-->/);
  const label = m ? m[1].trim() : 'A New Web Project';
  const href = m ? m[2].trim() : 'main';
  return { label, href, isWasm: href.startsWith('wasm:'), isExternal: /^https?:\/\//.test(href) };
}

// caps rendered <img> tags to a fixed size — without it, a static page's images have no
// size constraint at all and can blow up to their native dimensions. Deliberately its own
// inline style rather than reusing the client's .nw-image-frame__img class (320px), since
// this size is specific to the static build and shouldn't move the live site's default too
const STATIC_IMG_MAX_PX = 640;
function capImageSize(html) {
  const style = `max-width:${STATIC_IMG_MAX_PX}px;max-height:${STATIC_IMG_MAX_PX}px;width:auto;height:auto;object-fit:contain;display:block`;
  return html.replace(/<img\b/gi, `<img style="${style}"`);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// mdPath: root-relative path to the .md file, e.g. "/blog/post.md"
// prettyPath: the URL path this page is reachable at once live, e.g. "/blog/post" or "/"
function renderPageHtml(mdPath, prettyPath) {
  const raw = readMd(mdPath);
  const composed = processIncludes(raw);
  // real <img> tags, not the lazy-load placeholder spans the client renders to — so
  // images are visible with JS off and indexable by crawlers on the static build. The
  // client's processImages() only ever targets nw-img-placeholder spans, so it's a
  // harmless no-op against these on hydration; a later in-app SPA navigation back to
  // this page (full client render) still gets the normal framed/lightbox treatment.
  const contentHtml = capImageSize(render(composed));
  const title = extractTitle(raw);
  const logo = extractLogo(raw);

  let page = shell;
  page = page.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  page = page.replace(
    /<a id="nw-logo"[^>]*><\/a>/,
    logo.isWasm
      ? `<span id="nw-logo" class="nw-logo">${escapeHtml(logo.label)}</span>`
      : `<a id="nw-logo" class="nw-logo" href="${escapeHtml(logo.isExternal ? logo.href : toRootRelative(logo.href))}">${escapeHtml(logo.label)}</a>`
  );
  page = page.replace(
    /<div id="content">.*?<\/div>/s,
    `<div id="content" data-nw-ssg-path="${escapeHtml(prettyPath)}" class="nw-loaded">${contentHtml}</div>`
  );
  return page;
}

// ---- file discovery + output ----

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    if (dirname(join(dir, name)) === projectRoot && EXCLUDE.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, fn);
    else fn(full);
  }
}

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// mirror the whole project first (assets, .md files, the compiled wasm engine — everything
// the client still needs for in-app navigation and raw-file fetches), skipping the excluded dirs
walk(projectRoot, file => {
  const rel = relative(projectRoot, file);
  const dest = join(OUT_DIR, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(file, dest);
});

// then lay a pre-rendered .html sibling over every .md file
let count = 0;
walk(projectRoot, file => {
  if (extname(file) !== '.md') return;
  const rel = relative(projectRoot, file);
  const mdPath = '/' + rel.split(sep).join('/');

  const isMain = rel === 'main.md';
  const prettyPath = isMain ? '/' : '/' + rel.slice(0, -3);
  const outRel = isMain ? 'index.html' : rel.slice(0, -3) + '.html';

  const html = renderPageHtml(mdPath, prettyPath);
  const dest = join(OUT_DIR, outRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  count++;
});

console.log(`✓ generated ${count} static page(s) → ${relative(projectRoot, OUT_DIR) || 'static'}/`);
