#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
wasm-pack build --target web --out-dir ../engine/build/pkg --out-name engine
echo "✓ engine-rs built → engine/build/pkg/"
