# About NewWeb

You navigated here from `main.md` — the `md:` link was intercepted by `engine.js` and the Go WASM engine rendered this file in place.

## How it works

1. Go WASM (`engine.wasm`) exposes `newwebRender(md)` — a goldmark wrapper
2. `engine.js` intercepts clicks on `md:` links and fetches + renders the target file
3. `index.html` is the permanent shell; only `#content` changes

[Go back to main](md:main.md)
