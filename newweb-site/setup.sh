#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Copying engine artifacts..."
mkdir -p "$SCRIPT_DIR/static/engine/build/pkg"
mkdir -p "$SCRIPT_DIR/static/src"

mkdir -p "$SCRIPT_DIR/static/engine/lib"

cp "$PROJECT_ROOT/index.html"                            "$SCRIPT_DIR/static/index.html"
cp "$PROJECT_ROOT/engine/build/editor.bundle.js"         "$SCRIPT_DIR/static/engine/build/editor.bundle.js"
cp "$PROJECT_ROOT/engine/build/pkg/engine_bg.wasm"       "$SCRIPT_DIR/static/engine/build/pkg/engine_bg.wasm"
cp "$PROJECT_ROOT/engine/lib/wasm_exec_tiny.js"          "$SCRIPT_DIR/static/engine/lib/wasm_exec_tiny.js"
cp "$PROJECT_ROOT/src/auth.wasm"                         "$SCRIPT_DIR/static/src/auth.wasm"
cp "$PROJECT_ROOT/src/cms.wasm"                          "$SCRIPT_DIR/static/src/cms.wasm"
echo "✓ artifacts copied"

# Generate server config — pass custom password/username as args
PASSWORD="${1:-password123}"
USERNAME="${2:-admin}"
HASH=$(bun --eval "import { createHash } from 'node:crypto'; process.stdout.write(createHash('sha256').update('${PASSWORD}').digest('hex'))")

cat > "$SCRIPT_DIR/config.server.json" <<EOF
{
  "username": "${USERNAME}",
  "passwordHash": "${HASH}"
}
EOF
echo "✓ config.server.json written (username=${USERNAME})"
if [ "$PASSWORD" = "password123" ]; then
  echo "  ⚠  Using default password. Change it: bash setup.sh <password> [username]"
fi
