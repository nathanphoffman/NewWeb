import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');

const CSS_FILES = [
  'src/styles/theme-default.css',
  'src/styles/theme-newspaper.css',
  'src/styles/theme-dark.css',
  'src/styles/theme-terminal.css',
  'src/styles/theme-warm.css',
  'src/styles/theme-nasa.css',
  'src/styles/theme-cats.css',
  'src/styles/layout.css',
];

const css = CSS_FILES
  .map(f => readFileSync(join(root, f), 'utf8'))
  .join('\n');

const template = readFileSync(join(root, 'src/index.html'), 'utf8');
const html = template.replace('<!-- STYLES -->', `<style>\n${css}</style>`);

writeFileSync(join(root, '../index.html'), html);
console.log('✓ index.html written');
