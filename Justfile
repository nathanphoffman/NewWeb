default: build

# full build: rust wasm + typescript + copy css/html
build:
    cd engine && bash build.sh

# slim engine rebuild: no editor/auth (sync-site runs this same build internally)
build-engine:
    cd engine && npm run build

# rust wasm only
build-rs:
    bash engine-rs/build.sh

# go wasm modules
build-go:
    bash site/src/build.sh

# build the engine and copy its wasm + index.html into site/
sync-site:
    node sync-site.js

# start local dev server
serve: sync-site
    bun site/server.js

# watch typescript for changes
watch:
    cd engine && npm run watch

# copy latest build artifacts + docs into setup/ (runs sync-site internally)
update-setup:
    node sync-setup.js

# run the setup demo server
serve-setup:
    bun setup/server.js

# ensure setup/ (the lean build electron ships) is up to date
build-electron:
    node sync-setup.js

# build electron engine then start the app
electron: build-electron
    cd electron && npm start

# build and package into distributable (AppImage + deb on Linux)
package-electron: build-electron
    cd electron && npm run dist

# build everything then serve
dev: build-rs build-go serve
