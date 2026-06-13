default: build

# full build: rust wasm + typescript + copy css/html
build:
    cd engine && bash build.sh

# typescript only (fast rebuild during development)
build-engine:
    cd engine && npm run build && cp src/style.css ../style.css && cp src/index.html ../index.html

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
