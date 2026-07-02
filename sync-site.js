import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const engine = join(dir, 'engine');

console.log('→ building engine...');
execSync('npm run build', { cwd: engine, stdio: 'inherit' });

console.log('→ copying engine wasm + index.html → site/...');
const pkgDir = join(dir, 'site', 'engine', 'build', 'pkg');
mkdirSync(pkgDir, { recursive: true });
copyFileSync(join(engine, 'build', 'pkg', 'engine_bg.wasm'), join(pkgDir, 'engine_bg.wasm'));
copyFileSync(join(engine, 'build', 'index.html'), join(dir, 'site', 'index.html'));
console.log('✓ site/ synced');
