#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
GOOS=js GOARCH=wasm go build -o order.wasm order.go
echo "✓ src/order.wasm built"
