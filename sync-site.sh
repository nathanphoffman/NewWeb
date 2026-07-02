#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "→ building engine..."
cd "$SCRIPT_DIR/engine"
npm run build

echo "→ copying engine wasm + index.html → site/..."
mkdir -p "$SCRIPT_DIR/site/engine/build/pkg"
cp "$SCRIPT_DIR/engine/build/pkg/engine_bg.wasm" "$SCRIPT_DIR/site/engine/build/pkg/engine_bg.wasm"
cp "$SCRIPT_DIR/engine/build/index.html" "$SCRIPT_DIR/site/index.html"
echo "✓ site/ synced"
