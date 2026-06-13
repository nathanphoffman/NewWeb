default: build

# full build: rust wasm + typescript + copy css/html
build:
    cd engine && bash build.sh

# typescript + html/css rebuild (fast, no rust)
build-engine:
    cd engine && npm run build

# rust wasm only
build-rs:
    bash engine-rs/build.sh

# go wasm modules
build-go:
    bash src/build.sh

# start local dev server
serve:
    node server.js

# watch typescript for changes
watch:
    cd engine && npm run watch

# copy latest build artifacts into setup/
update-setup: build-engine
    cp index.html setup/index.html
    mkdir -p setup/engine/build/pkg
    cp engine/build/pkg/engine_bg.wasm setup/engine/build/pkg/engine_bg.wasm

# run the setup demo server
serve-setup:
    node setup/server.js

# build everything then serve
dev: build-rs build-go build-engine serve
