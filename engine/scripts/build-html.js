import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// The entire point of this script is to build 1 large index.html
//  this allows users to merely include a single html and wasm file to
//  get up and running with markdown rendering

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const stylesDir = join(root, 'src/styles');

const css = readdirSync(stylesDir)
  .filter(f => f.endsWith('.css'))
  // guarantees order of inclusion is the same across OS platforms
  // in theory sort here matters little, but two builds could output different 
  // html builds that are identical causing delta flip-flops if deployed
  .sort()
  .map(f => readFileSync(join(stylesDir, f), 'utf8'))
  .join('\n');

const js = readFileSync(join(root, 'build/engine.bundle.js'), 'utf8');

let html = readFileSync(join(root, 'src/index.html'), 'utf8');
html = html.replace('<!-- STYLES -->', `<style>\n${css}</style>`);
html = html.replace('<!-- SCRIPT -->', `<script type="module">\n${js}</script>`);

writeFileSync(join(root, '../index.html'), html);
console.log('✓ index.html written');
