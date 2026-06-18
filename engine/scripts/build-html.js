import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { transformSync } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// The entire point of this script is to build 1 large index.html
//  this allows users to merely include a single html and wasm file to
//  get up and running with markdown rendering

const dir  = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const stylesDir = join(root, 'src/styles');

// Optional args: [templateFile, outputFile, jsBundleFile]
const templateFile = process.argv[2] ?? 'src/index.html';
const outputFile   = process.argv[3] ?? '../index.html';
const jsBundleFile = process.argv[4] ?? 'build/engine.bundle.js';

// Reads a bare theme CSS file (no [data-theme] selectors) and scopes every
// rule to [data-theme="X"]. :root becomes [data-theme="X"]; @keyframes and
// other at-rules are left at the top level unchanged.
function prefixThemeCSS(rawCss, theme) {
  const attr = `[data-theme="${theme}"]`;
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments
  let result = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    while (i < len && /\s/.test(css[i])) i++;
    if (i >= len) break;

    const selStart = i;
    while (i < len && css[i] !== '{') i++;
    const selector = css.slice(selStart, i).trim();
    if (!selector || i >= len) break;
    i++; // skip '{'

    const isAtRule = /^@(keyframes|font-face|media|supports)/i.test(selector);
    let depth = 1;
    const bodyStart = i;
    while (i < len && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    const body = css.slice(bodyStart, i - 1);

    if (isAtRule) {
      result += `${selector} {${body}}\n`;
    } else if (selector === ':root') {
      result += `${attr} {${body}}\n`;
    } else {
      const prefixed = selector.split(',').map(s => `${attr} ${s.trim()}`).join(',\n');
      result += `${prefixed} {${body}}\n`;
    }
  }

  return result;
}

// esbuild may extract CSS imports to a separate bundle file — include it
// first so @font-face rules are declared before theme rules that reference them.
// Delete it after reading so stale font data can't accumulate across builds.
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
  .map(f => {
    const css = readFileSync(join(stylesDir, f), 'utf8');
    const themeMatch = f.match(/^theme-(.+)\.css$/);
    if (themeMatch) return prefixThemeCSS(css, themeMatch[1]);
    return css;
  })
  .join('\n');

const css = transformSync(rawCss, { loader: 'css', minify: true }).code;
const js = readFileSync(join(root, jsBundleFile), 'utf8');

let html = readFileSync(join(root, templateFile), 'utf8');
html = html.replace('<!-- STYLES -->', `<style>\n${css}</style>`);
html = html.replace('<!-- SCRIPT -->', `<script type="module">\n${js}</script>`);

writeFileSync(join(root, outputFile), html);
console.log(`✓ ${outputFile} written`);
