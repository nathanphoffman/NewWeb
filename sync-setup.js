import { execFileSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));

execFileSync(process.execPath, [join(dir, 'sync-site.js')], { stdio: 'inherit' });

console.log('→ syncing → setup/...');
const pkgDir = join(dir, 'setup', 'engine', 'build', 'pkg');
mkdirSync(pkgDir, { recursive: true });
copyFileSync(join(dir, 'site', 'index.html'), join(dir, 'setup', 'index.html'));
copyFileSync(join(dir, 'site', 'engine', 'build', 'pkg', 'engine_bg.wasm'), join(pkgDir, 'engine_bg.wasm'));
console.log('✓ setup/ synced');

console.log('→ copying documentation...');
copyFileSync(join(dir, 'site', 'documentation.md'), join(dir, 'setup', 'documentation.md'));
console.log('✓ documentation.md copied to setup/');
