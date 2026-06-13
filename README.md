# NewWeb

A markdown-first web framework powered by WASM.

## Quickstart

```bash
npx degit nathanphoffman/NewWeb/setup my-site
cd my-site
npm start
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
