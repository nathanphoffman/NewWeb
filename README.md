# NewWeb

A markdown-first web framework powered by WASM.

## Quickstart

```bash
npx degit https://github.com/nathanphoffman/NewWeb/setup my-site
cd my-site
npm start
```

Open `http://localhost:8080`.

## Documentation

Full feature reference is in [`documentation.md`](documentation.md). It covers links, themes, WASM scripting, templates, the session store API, images, settings, and build scripts. A copy is included in every project created from `setup/` for local AI and user reference.

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

After changing engine source, run the sync script to rebuild and update `setup/`.

**Linux / macOS:**
```bash
bash sync-setup.sh
```

**Windows (PowerShell):**
```powershell
.\sync-setup.ps1
```

This rebuilds the JS bundle and copies all artifacts into `setup/`.
