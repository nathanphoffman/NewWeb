default: build

# full build: rust wasm + typescript + copy css/html
build:
    cd engine && bash build.sh

# slim engine rebuild: no editor/auth, used by just dev
build-engine:
    cd engine && npm run build

# full engine rebuild: includes editor + auth, used by serve-site
build-engine-full:
    cd engine && npm run build:full

# rust wasm only
build-rs:
    bash engine-rs/build.sh

# go wasm modules
build-go:
    bash src/build.sh

# ensure site/ has symlinks to the build artifacts it depends on
link-site:
    ln -sfn ../engine site/engine
    ln -sfn ../src site/src

# start local dev server
serve: link-site
    node site/server.js

# watch typescript for changes
watch:
    cd engine && npm run watch

# copy latest build artifacts into setup/
update-setup: build-engine
    cp site/index.html setup/index.html
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

# build and package into distributable (AppImage + deb on Linux)
package-electron: build-electron
    cd electron && npm run dist

# copy engine artifacts into newweb-site/static/ and start the Bun server
serve-site: build-engine-full build-go
    bash newweb-site/setup.sh
    cd newweb-site && bun server.ts

# build everything then serve
dev: build-rs build-go build-engine serve
