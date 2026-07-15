import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const engine = join(dir, 'engine');

console.log('→ regenerating TinyGo wasm_exec runtime...');
execSync('cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" lib/wasm_exec_tiny.js', { cwd: engine, stdio: 'inherit', shell: '/bin/bash' });

console.log('→ building engine...');
execSync('npm run build', { cwd: engine, stdio: 'inherit' });

console.log('→ copying engine wasm + runtime + index.html → site/...');
const pkgDir = join(dir, 'site', 'engine', 'build', 'pkg');
const libDir = join(dir, 'site', 'engine', 'lib');
mkdirSync(pkgDir, { recursive: true });
mkdirSync(libDir, { recursive: true });
copyFileSync(join(engine, 'build', 'pkg', 'engine_bg.wasm'), join(pkgDir, 'engine_bg.wasm'));
copyFileSync(join(engine, 'lib', 'wasm_exec_tiny.js'), join(libDir, 'wasm_exec_tiny.js'));
copyFileSync(join(engine, 'build', 'index.html'), join(dir, 'site', 'index.html'));
console.log('✓ site/ synced');
