# NewWeb

A markdown-first web framework powered by WASM.

## Quickstart

```bash
npx degit https://github.com/nathanphoffman/NewWeb/setup my-site
cd my-site
npm start
```

Open `http://localhost:8080`.

## Adding content

Create `.md` files in the folder and link between them using plain links — no prefix or extension needed:

```markdown
[About](about)
[Nested page](blog/post)
```

## Static hosting

No server required for hosting — drop the folder contents on any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.). The only files needed are:

- `index.html`
- `engine/build/pkg/engine_bg.wasm`
- your `.md` files
