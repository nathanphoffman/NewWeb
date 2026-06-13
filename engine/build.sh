#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "→ building engine (Rust)..."
bash ../engine-rs/build.sh

echo "→ copying wasm_exec_tiny.js for dev modules..."
cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" lib/wasm_exec_tiny.js

echo "→ installing JS deps..."
npm install --silent

echo "→ compiling TypeScript + building index.html..."
npm run build

echo "✓ done. serve with: python3 -m http.server 8080"
