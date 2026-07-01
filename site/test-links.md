# Link & Anchor Test

All representations that navigate to `test-links-target.md`.

---

## Bare path links `[](path)`

### File only

- [with .md extension](test-links-target.md)
- [without .md extension](test-links-target)

### File + section anchor

- [with .md + #alpha](test-links-target.md#alpha)
- [with .md + #beta](test-links-target.md#beta)
- [without .md + #alpha](test-links-target#alpha)
- [without .md + #beta](test-links-target#beta)

---

## Hash-prefixed path links `[](#path)`

Requires either a `/` in the path or a `.md` extension — otherwise the engine
can't distinguish it from a same-page anchor.

### File only

- [#-prefixed with .md extension](#test-links-target.md)
- `[](#test-links-target)` — ambiguous (no slash, no .md), treated as same-page anchor

### File + section anchor

- [#-prefixed with .md + #alpha](#test-links-target.md#alpha)
- [#-prefixed with .md + #beta](#test-links-target.md#beta)

---

## Same-page anchors (for contrast)

These scroll within this page only.

- [jump to Bare path links](#bare-path-links-path)
- [jump to Hash-prefixed section](#hash-prefixed-path-links-path)
