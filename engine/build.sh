#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "→ building engine (Rust)..."
bash ../engine-rs/build.sh

echo "→ copying wasm_exec_tiny.js for dev modules..."
cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" lib/wasm_exec_tiny.js

echo "→ installing JS deps..."
npm install --silent

echo "→ compiling TypeScript..."
npm run build

echo "→ copying CSS + HTML to project root..."
cp src/style.css ../style.css
cp src/index.html ../index.html

echo "✓ done. serve with: python3 -m http.server 8080"
