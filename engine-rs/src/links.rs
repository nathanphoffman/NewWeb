use pulldown_cmark::CowStr;

// Rewrites a bare relative link/image target (e.g. "blog/coding.md") to be root-relative
// ("/blog/coding.md"). Anything else (already absolute, `#anchor`, `https:`, `wasm:`, ...)
// is returned unchanged.
//
// Markdown is rendered to a static href/src that the browser resolves on its own for anything
// JS doesn't intercept — new tabs, view-source, no-JS, crawlers — and browsers resolve relative
// URLs against the *current page's* path, not the site root. Without this, a page nested in a
// subdirectory turns its own sibling links into broken doubled paths (e.g. /blog/coding linking
// to "watch.md" would resolve to /blog/watch.md by luck at depth 0, but /blog/blog/watch.md from
// a page already inside /blog/). Rewriting at render time, once, keeps every consumer (link
// clicks, raw navigation, image loading) in agreement automatically.
pub fn make_root_relative(target: CowStr<'_>) -> CowStr<'_> {
    if needs_leading_slash(&target) {
        CowStr::from(format!("/{target}"))
    } else {
        target
    }
}

fn needs_leading_slash(url: &str) -> bool {
    !(url.is_empty() || url.starts_with('#') || url.starts_with('/') || has_scheme(url))
}

// true if `url` starts with a URI scheme (`http:`, `wasm:`, `custom://`, `mailto:`, ...).
// Checked generically against RFC 3986 scheme syntax rather than a hardcoded protocol
// list, so it stays correct as new pseudo-protocols are added elsewhere in the engine.
fn has_scheme(url: &str) -> bool {
    match url.find(':') {
        None => false,
        Some(colon) => {
            let scheme = &url[..colon];
            !scheme.is_empty()
                && scheme.starts_with(|c: char| c.is_ascii_alphabetic())
                && scheme.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
        }
    }
}
