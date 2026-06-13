# NewWeb Setup

Get a newweb site running locally in seconds.

## Quickstart

```bash
npx degit yourname/newweb/setup my-site
cd my-site
node server.js
```

Open `http://localhost:8080`.

## Adding content

Create `.md` files in the folder and link between them using the `md:` protocol:

```markdown
[About](md:about.md)
```

## Static hosting

No server required for hosting — drop the folder contents on any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.). The only files needed are:

- `index.html`
- `engine/build/pkg/engine_bg.wasm`
- your `.md` files
