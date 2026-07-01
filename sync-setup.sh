#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$SCRIPT_DIR/engine"

echo "→ building JS..."
cd "$ENGINE"
npm run build:js
npm run build:html
echo "✓ built → $SCRIPT_DIR/index.html"

echo "→ syncing → setup/..."
cp "$SCRIPT_DIR/index.html"           "$SCRIPT_DIR/setup/index.html"
cp "$ENGINE/build/pkg/engine_bg.wasm" "$SCRIPT_DIR/setup/engine/build/pkg/engine_bg.wasm"
echo "✓ setup/ synced"

echo "→ copying documentation..."
cp "$SCRIPT_DIR/documentation.md" "$SCRIPT_DIR/setup/documentation.md"
echo "✓ documentation.md copied to setup/"
