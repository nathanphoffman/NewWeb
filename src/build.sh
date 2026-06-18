#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
tinygo build -target wasm -o order.wasm ./order/
echo "✓ src/order.wasm built"
tinygo build -target wasm -o visit.wasm ./visit/
echo "✓ src/visit.wasm built"
tinygo build -target wasm -o menu.wasm ./menu/
echo "✓ src/menu.wasm built"
tinygo build -target wasm -o profile.wasm ./profile/
echo "✓ src/profile.wasm built"
tinygo build -target wasm -o auth.wasm ./auth/
echo "✓ src/auth.wasm built"
tinygo build -target wasm -o cms.wasm ./cms/
echo "✓ src/cms.wasm built"
