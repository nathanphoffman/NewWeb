<!-- themes: cats -->
# NewWeb Documentation

NewWeb is a markdown-first web framework. Sites are `.md` files rendered in the browser via a Rust WASM engine. No build step required for content — just write markdown.

---

## Builds

Get started: `npx degit .../setup my-site`. Includes the viewer, themes, and WASM scripting.

Runs with `npm start` → `http://localhost:8080`. Requires [Bun](https://bun.sh) — the
dev server uses it to rewrite pretty page URLs (e.g. `/about`) to `index.html` so
direct navigation and refresh work without a hash.

Required files: `index.html`, `engine/build/pkg/engine_bg.wasm`, `.md` files. Hosting
anywhere other than the bundled server requires equivalent rewrite rules (serve
`index.html` for any path whose matching `.md` file exists) for pretty URLs to survive
a hard refresh.

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

**Page title** — add to any `.md` file to set the browser tab title while that page is open:

```markdown
<!-- title: Nate's Site -->
```

Resets to the site's default title when navigating to a page that doesn't declare one.

**Include other files** — pull other `.md` files into the current page:

```markdown
<!-- include: docs/chapter2.md, docs/chapter3.md -->
```

With no `sort:`, the referenced files are fetched and stitched into the page in the order listed — useful for breaking up one long document into several files.

Add `sort:` to instead treat each referenced file as a collection of many entries and merge them all into one combined, ordered listing (e.g. a blog index built from several category files):

```markdown
<!-- include: docs/coding.md, docs/space.md, sort: #, sort_dir: desc, limit_to: 20 -->
```

- `sort: #` splits each file into entries on its top-level (`#`) headings; the entry's sort key is the heading text.
- `sort: "date posted:"` splits on any line starting with that literal text instead; the sort key is whatever follows it on that line. Use a consistently sortable format like `YYYY-MM-DD` — this is a plain text sort, not real date parsing.
- `sort_dir: asc` (default) or `desc`.
- `limit_to: N` keeps only the first N entries after all files are merged and sorted (not per file).
- Entries always include their full content — there's no preview/excerpt mode.
- Text in a file before its first matching marker line isn't part of any entry and is dropped.
- One level of nesting is resolved (an included file may itself use `include:`); anything nested deeper than that is left as-is.

---

## Settings

The Settings button (nav bar) opens a modal with:

- **Max auto-load image size (KB)** — images above this threshold show a "click to load" button instead of loading automatically. Default: 200 KB.
- **Animations** — pause or resume all theme animations.
- **Session data** — view current session store contents.

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

WASM modules interact with the engine via `window.newweb`.

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

### Rebuild the setup package after engine changes:

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
bash engine/build.sh        # builds Rust WASM + JS
bash engine-rs/build.sh     # Rust WASM only (wasm-pack)
bash src/build.sh           # TinyGo WASM example modules (menu, order, profile, visit)
```

### Engine npm scripts (run from `engine/`):

```bash
npm run build              # typecheck + JS + HTML
npm run watch               # JS in watch mode
npm run typecheck          # TypeScript only
```
