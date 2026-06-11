#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "→ fetching dependencies..."
go mod tidy

echo "→ building engine.wasm..."
GOOS=js GOARCH=wasm go build -o engine.wasm .

echo "→ copying wasm_exec.js..."
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .

echo "✓ done. serve with: python3 -m http.server 8080"
