<!-- themes: cats -->
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

## Same-page anchors (for contrast)

A leading `#` with no `/` or `.md` is always a same-page anchor — handled
natively by the browser, no routing involved.

- [jump to Bare path links](#bare-path-links-path)
