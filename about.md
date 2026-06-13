# About NewWeb

You navigated here from `main.md` — the link was intercepted by the engine and the WASM renderer rendered this file in place.

## How it works

1. Rust WASM (`engine_bg.wasm`) exposes `newwebRender(md)` — a pulldown-cmark wrapper
2. The engine intercepts clicks on bare links and fetches + renders the target `.md` file
3. `index.html` is the permanent shell; only `#content` changes

[Go back to main](main)
