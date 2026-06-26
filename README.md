# NewWeb

A markdown-first web framework powered by WASM.

## Quickstart

Two builds are available — pick the one that fits your use case:

**Slim** — viewer only, lightweight (recommended for static sites and blogs):
```bash
npx degit https://github.com/nathanphoffman/NewWeb/setup my-site
cd my-site
npm start
```

**Full** — includes an in-browser markdown editor powered by CodeMirror:
```bash
npx degit https://github.com/nathanphoffman/NewWeb/setup-full my-site
cd my-site
npm start
```

Open `http://localhost:8080`.

## Documentation

Full feature reference is in [`documentation.md`](documentation.md). It covers links, themes, WASM scripting, templates, the session store API, images, settings, and build scripts. A copy is included in every project created from `setup/` or `setup-full/` for local AI and user reference.

## Adding content

Create `.md` files in the folder and link between them using plain links — no prefix or extension needed:

```markdown
[About](about)
[Nested page](blog/post)
```

## Static hosting

No server required for hosting — drop the folder contents on any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.).

Slim build requires:
- `index.html`
- `engine/build/pkg/engine_bg.wasm`
- your `.md` files

Full build additionally requires:
- `engine/build/editor.bundle.js`

## Updating the setup builds

After changing engine source, run the sync script to rebuild and update both `setup/` and `setup-full/`.

**Linux / macOS:**
```bash
bash sync-setup.sh
```

**Windows (PowerShell):**
```powershell
.\sync-setup.ps1
```

This rebuilds the slim and full JS bundles and copies all artifacts into the appropriate setup directories.
