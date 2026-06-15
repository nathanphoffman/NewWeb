import { readFileSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { transformSync } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// The entire point of this script is to build 1 large index.html
//  this allows users to merely include a single html and wasm file to
//  get up and running with markdown rendering

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const stylesDir = join(root, 'src/styles');

// esbuild may extract CSS imports to a separate bundle file — include it
// first so @font-face rules are declared before theme rules that reference them.
// Delete it after reading so stale font data can't accumulate across builds.
import { existsSync } from 'fs';
const bundledCssPath = join(root, 'build/engine.bundle.css');
const bundledCss = existsSync(bundledCssPath)
  ? readFileSync(bundledCssPath, 'utf8')
  : '';
if (existsSync(bundledCssPath)) rmSync(bundledCssPath);

const rawCss = bundledCss + '\n' + readdirSync(stylesDir)
  .filter(f => f.endsWith('.css'))
  // guarantees order of inclusion is the same across OS platforms
  // in theory sort here matters little, but two builds could output different
  // html builds that are identical causing delta flip-flops if deployed
  .sort()
  .map(f => readFileSync(join(stylesDir, f), 'utf8'))
  .join('\n');

const css = transformSync(rawCss, { loader: 'css', minify: true }).code;
const js = readFileSync(join(root, 'build/engine.bundle.js'), 'utf8');

let html = readFileSync(join(root, 'src/index.html'), 'utf8');
html = html.replace('<!-- STYLES -->', `<style>\n${css}</style>`);
html = html.replace('<!-- SCRIPT -->', `<script type="module">\n${js}</script>`);

writeFileSync(join(root, '../index.html'), html);
console.log('✓ index.html written');
