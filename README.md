# NewWeb

A markdown-first web framework powered by WASM.

## Quickstart

```bash
npx degit https://github.com/nathanphoffman/NewWeb/setup my-site
cd my-site
npm start
```

Open `http://localhost:8080`.

To pull the latest runtime files (`index.html`, `engine_bg.wasm`, `server.js`, `update.js`) later, without touching your own markdown files or `package.json`:

```bash
npm run update
```

## Documentation

Full feature reference is in [`documentation.md`](site/documentation.md). It covers links, themes, WASM scripting, templates, the session store API, images, settings, and build scripts. A copy is included in every project created from `setup/` for local AI and user reference.

## Adding content

Create `.md` files in the folder and link between them using plain links — no prefix or extension needed:

```markdown
[About](about)
[Nested page](blog/post)
```

## Static hosting

No server required for hosting — drop the folder contents on any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.).

Requires:
- `index.html`
- `engine/build/pkg/engine_bg.wasm`
- your `.md` files

## Updating the setup build

After changing engine source, run the sync script to rebuild and update `setup/`:

```bash
node sync-setup.js
```

This rebuilds the JS bundle and copies all artifacts into `setup/`.

## Development setup

Prerequisites:
- [Rust + cargo](https://rustup.rs)
- Node.js + npm
- Go
- [`just`](https://github.com/casey/just)

Install the wasm/Go toolchain:

```bash
cargo install wasm-pack

# TinyGo (Linux, via .deb — see https://tinygo.org/getting-started/install/ for other platforms)
wget https://github.com/tinygo-org/tinygo/releases/download/v0.37.0/tinygo_0.37.0_amd64.deb
sudo dpkg -i tinygo_0.37.0_amd64.deb
# or: sudo snap install tinygo --classic
```

Install engine dependencies and run the dev server:

```bash
cd engine && npm install && cd ..
just dev
```
