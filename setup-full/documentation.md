# NewWeb Documentation

NewWeb is a markdown-first web framework. Sites are `.md` files rendered in the browser via a Rust WASM engine. No build step required for content — just write markdown.

---

## Builds

| Build | Command | Includes |
|-------|---------|----------|
| **Slim** | `npx degit .../setup my-site` | Viewer, themes, WASM scripting |
| **Full** | `npx degit .../setup-full my-site` | Everything above + in-browser markdown editor, auth, CMS |

Both builds run with `npm start` → `http://localhost:8080`.

Required files for static hosting:
- **Slim**: `index.html`, `engine/build/pkg/engine_bg.wasm`, `.md` files
- **Full**: above + `engine/build/editor.bundle.js`

---

## Content

`main.md` is the home page. Any `.md` file in the project root or subdirectories is a navigable page.

---

## Links

All link types handled by the engine:

```markdown
[Page](about)              # loads about.md
[Page](about.md)           # same
[Page](blog/post)          # loads blog/post.md
[Page](about#section)      # loads about.md and scrolls to heading
[Jump](#heading-id)        # scrolls within current page
[Modal](more:file.md)      # opens file.md in an overlay modal
[External](https://x.com)  # opens normally in browser
[Script](wasm:src/app.wasm) # runs a WASM module (see Scripting)
```

**Cross-domain redirects** show a 3-second countdown modal with a cancel button.

**Bare URL warning**: on localhost, a link like `[Star Trek](startrek.com)` (no `https://`) shows an error toast.

---

## Themes

19 built-in themes. Some have animated effects (matrix rain, falling petals, scanlines, etc.).

`aurora` · `beach` · `blackboard` · `blueprint` · `carbon` · `cats` · `chromatic` · `crt` · `cyber` · `dusk` · `glacier` · `moss` · `quill` · `sakura` · `scribe` · `slate` · `space` · `storm` · `terminal`

**Theme picker** is in the nav bar. Preference is saved to `localStorage`.

**Page-suggested theme** — add to any `.md` file:

```markdown
<!-- themes: carbon -->
```

The suggested theme appears as "(site default)" in the picker. It applies automatically only if the user has no saved preference. Multiple suggestions are comma-separated: `<!-- themes: carbon, slate -->`.

**Theme priority**: user saved preference → page suggestion → system dark/light mode (carbon / quill).

---

## Settings

The Settings button (nav bar) opens a modal with:

- **Max auto-load image size (KB)** — images above this threshold show a "click to load" button instead of loading automatically. Default: 200 KB.
- **Animations** — pause or resume all theme animations.
- **Session data** — view current session store contents.
- **Login** *(full build only)* — opens login form for CMS auth.

---

## Images

Standard markdown image syntax. Images are rendered in a styled frame with a lightbox on click.

```markdown
![caption](photo.jpg)
```

Images over the auto-load size limit display a load button instead. The threshold is configurable in Settings.

---

## WASM Scripting

Links with the `wasm:` scheme execute a TinyGo-compiled WASM module when clicked.

```markdown
[Run Script](wasm:src/myscript.wasm)
```

### Form fields

Declare HTML comment blocks before the link to collect user input before the script runs. Each `<!-- fields: -->` comment becomes one section of the form.

```markdown
<!-- fields: firstName:text, lastName:text -->
<!-- fields: email:email, phone:tel:15 -->
<!-- fields: size:S|M|L|XL, qty:number:2 -->
[Submit Order](wasm:src/order.wasm)
```

Field syntax: `key:type` or `key:type:maxlength` or `key:option1|option2|...` (select).
Supported types: `text`, `email`, `tel`, `password`, `number`, and any `|`-delimited list (renders as a `<select>`).

### Script transparency

```markdown
<!-- script_reasoning: Collects shipping details before placing your order -->
<!-- data: firstName, lastName, email -->
[Place Order](wasm:src/order.wasm)
```

- `<!-- script_reasoning: ... -->` — shown in the ⚙ info button next to the link, explaining why the script runs.
- `<!-- data: key1, key2 -->` — declares which session keys the script will read. Also shown in the info modal.

### Page refresh on data

```markdown
<!-- refresh: src/profile.wasm -->
```

If a page is loaded without session data, this comment adds a "This page requires data. [Load now]" prompt at the top.

---

## `window.newweb` API

WASM modules interact with the engine via `window.newweb`. All calls are available in both builds unless noted.

| Method | Description |
|--------|-------------|
| `newweb.redirect(url, reason?)` | Navigate to internal page or open external URL with redirect modal |
| `newweb.replace(url)` | Replace current page without pushing history |
| `newweb.info(markdown)` | Show an info toast |
| `newweb.error(markdown)` | Show an error toast |
| `newweb.more(markdown)` | Show markdown in an overlay modal |
| `newweb.load(url, data)` | Navigate to a page and render it with template data |
| `newweb.store(key, value)` | Write a value to the session store |
| `newweb.get(key)` | Read a value from the session store (scoped to declared keys) |
| `newweb.auth(success, hash, user)` | Auth result callback *(full build only)* |
| `newweb.apiFetch(method, url, body)` | Authenticated API request with HMAC token *(full build only)* |

Session store data is in-memory only — cleared on page refresh or navigation away.

---

## Templates

Pages loaded via `newweb.load(url, data)` support template directives.

**Interpolation:**
```markdown
Hello, ${firstName}!
```

**Conditional partial:**
```markdown
<!-- if: isMember use partials/member-banner.md -->
```

Includes `partials/member-banner.md` only when `data.isMember` is truthy. Interpolation runs on the partial using the same data object.

**Loop partial:**
```markdown
<!-- foreach: items use partials/item-row.md -->
```

Repeats `partials/item-row.md` for each element in `data.items`. Each repetition interpolates `${key}` against that item's properties.

---

## Config

An optional `newweb.config.json` file in the project root is loaded on startup *(full build only)* and flattened into the session store under the `config.` prefix.

```json
{
  "auth": {
    "endpoint": "/api/auth",
    "hashMethod": "plain"
  }
}
```

These values are accessible to WASM modules as `config.auth.endpoint`, `config.auth.hashMethod`, etc.

---

## In-Browser Editor *(full build only)*

When logged in, the nav bar shows **Edit** and **Add** buttons.

- **Edit** — opens the current page's markdown in a CodeMirror editor. Saving runs `src/cms.wasm` to persist the change.
- **Add** — opens a new-file editor. Saving creates the file via `src/cms.wasm`.

---

## URL Structure

Pages are hash-routed. The URL updates as you navigate:

```
http://localhost:8080/#main.md
http://localhost:8080/#about.md
http://localhost:8080/#blog/post.md#section-heading
```

Browser back/forward buttons work normally.

---

## Development

### Rebuild both setup packages after engine changes:

**Linux / macOS:**
```bash
bash sync-setup.sh
```

**Windows:**
```powershell
.\sync-setup.ps1
```

### Engine build scripts (run from repo root):

```bash
bash engine/build.sh        # builds Rust WASM + slim JS
bash engine-rs/build.sh     # Rust WASM only (wasm-pack)
bash src/build.sh           # TinyGo WASM modules (auth, cms, etc.)
```

### Engine npm scripts (run from `engine/`):

```bash
npm run build              # slim (typecheck + JS + HTML)
npm run build:full         # full (typecheck + editor + JS + HTML)
npm run watch              # slim JS in watch mode
npm run typecheck          # TypeScript only
```
