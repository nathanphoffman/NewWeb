#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$SCRIPT_DIR/engine"

echo "→ building slim JS..."
cd "$ENGINE"
npm run build:js-slim
npm run build:html-slim
echo "✓ slim built → $SCRIPT_DIR/index.html"

echo "→ syncing slim → setup/..."
cp "$SCRIPT_DIR/index.html"                           "$SCRIPT_DIR/setup/index.html"
cp "$ENGINE/build/pkg/engine_bg.wasm"                 "$SCRIPT_DIR/setup/engine/build/pkg/engine_bg.wasm"
echo "✓ setup/ synced (viewer only)"

echo "→ building full JS..."
npm run build:editor-js
npm run build:js
npm run build:html-full
echo "✓ full built → $SCRIPT_DIR/index-full.html"

echo "→ syncing full → setup-full/..."
mkdir -p "$SCRIPT_DIR/setup-full/engine/build/pkg"
cp "$SCRIPT_DIR/index-full.html"                      "$SCRIPT_DIR/setup-full/index.html"
cp "$ENGINE/build/pkg/engine_bg.wasm"                 "$SCRIPT_DIR/setup-full/engine/build/pkg/engine_bg.wasm"
cp "$ENGINE/build/editor.bundle.js"                   "$SCRIPT_DIR/setup-full/engine/build/editor.bundle.js"
echo "✓ setup-full/ synced (with markdown editor)"

echo "→ copying documentation..."
cp "$SCRIPT_DIR/documentation.md" "$SCRIPT_DIR/setup/documentation.md"
cp "$SCRIPT_DIR/documentation.md" "$SCRIPT_DIR/setup-full/documentation.md"
echo "✓ documentation.md copied to both setups"

echo ""
echo "Both builds synced:"
echo "  setup/      → slim (viewer only, ~lightweight)"
echo "  setup-full/ → full (with in-browser markdown editor)"
