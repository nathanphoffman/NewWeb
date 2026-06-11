#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
wasm-pack build --target web --out-dir ../engine/pkg --out-name engine
echo "✓ engine-rs built → engine/pkg/"
