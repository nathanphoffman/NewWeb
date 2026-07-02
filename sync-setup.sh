#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$SCRIPT_DIR/sync-site.sh"

echo "→ syncing → setup/..."
mkdir -p "$SCRIPT_DIR/setup/engine/build/pkg"
cp "$SCRIPT_DIR/site/index.html"                       "$SCRIPT_DIR/setup/index.html"
cp "$SCRIPT_DIR/site/engine/build/pkg/engine_bg.wasm"  "$SCRIPT_DIR/setup/engine/build/pkg/engine_bg.wasm"
echo "✓ setup/ synced"

echo "→ copying documentation..."
cp "$SCRIPT_DIR/site/documentation.md" "$SCRIPT_DIR/setup/documentation.md"
echo "✓ documentation.md copied to setup/"
