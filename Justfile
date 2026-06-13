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
    python3 -m http.server 8080

# watch typescript for changes
watch:
    cd engine && npm run watch

# build then serve
dev: build serve
