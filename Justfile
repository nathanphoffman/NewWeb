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

# build electron engine bundle and ensure shared/ symlinks exist
build-electron:
    cd engine && npm run build:electron
    mkdir -p shared
    ln -sfn ../engine/build/pkg shared/pkg
    ln -sfn ../engine/src/styles shared/styles

# build electron engine then start the app
electron: build-electron
    cd electron && npm start

# start minimal test site on port 3000
simple-site:
    node simple-site/server.js

# build everything then serve
dev: build-rs build-go build-engine serve
