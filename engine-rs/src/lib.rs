use pulldown_cmark::{html, CowStr, Event, Options, Parser, Tag};
use wasm_bindgen::prelude::*;

// `Options::all()` turns on several extensions that misfire on ordinary prose
// and aren't used anywhere in this project, so we opt back out of them:
// - YAML/pluses metadata blocks: any matching `---`/`+++` fence anywhere in
//   the document (not just the top) is treated as frontmatter and its
//   content is silently dropped from the rendered HTML. We use `---` as a
//   plain divider, so this must stay off.
// - Heading attributes (`## text {#id .class}`): a heading that happens to
//   end in `{...}` has that text eaten into bogus HTML attributes instead of
//   rendering. We already generate heading ids ourselves in ui.ts.
// - Old-style footnotes: `Options::all()` sets this bit alongside the modern
//   one, which silently downgrades footnotes to legacy syntax — most
//   notably, an undefined `[^ref]` renders as a real dangling link instead
//   of visible literal text. Clear it and re-add the modern flag.
// - Definition lists / math: unused extensions whose trigger syntax
//   (a line starting with `: `, or bare `$`) can misfire on normal prose.
fn render_options() -> Options {
    let excluded = Options::ENABLE_YAML_STYLE_METADATA_BLOCKS
        | Options::ENABLE_PLUSES_DELIMITED_METADATA_BLOCKS
        | Options::ENABLE_HEADING_ATTRIBUTES
        | Options::ENABLE_OLD_FOOTNOTES
        | Options::ENABLE_DEFINITION_LIST
        | Options::ENABLE_MATH;
    (Options::all() - excluded) | Options::ENABLE_FOOTNOTES
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

// rewrites a bare relative link/image target (e.g. "blog/coding.md") to be root-relative
// ("/blog/coding.md"). Markdown is rendered to a static href/src that the browser resolves
// on its own for anything JS doesn't intercept — new tabs, view-source, no-JS, crawlers — and
// browsers resolve relative URLs against the *current page's* path, not the site root. Without
// this, a page nested in a subdirectory turns its own sibling links into broken doubled paths
// (e.g. /blog/coding linking to "watch.md" would resolve to /blog/watch.md by luck at depth 0,
// but /blog/blog/watch.md from a page already inside /blog/). Rewriting at render time, once,
// keeps every consumer (link clicks, raw navigation, image loading) in agreement automatically.
fn root_relative(url: &str) -> Option<String> {
    if url.is_empty() || url.starts_with('#') || url.starts_with('/') || has_scheme(url) {
        None
    } else {
        Some(format!("/{url}"))
    }
}

fn rewrite_dest<'a>(dest_url: CowStr<'a>) -> CowStr<'a> {
    match root_relative(&dest_url) {
        Some(rewritten) => CowStr::from(rewritten),
        None => dest_url,
    }
}

#[wasm_bindgen]
pub fn render(md: &str) -> String {
    let parser = Parser::new_ext(md, render_options()).map(|event| match event {
        Event::Start(Tag::Link { link_type, dest_url, title, id }) => {
            Event::Start(Tag::Link { link_type, dest_url: rewrite_dest(dest_url), title, id })
        }
        Event::Start(Tag::Image { link_type, dest_url, title, id }) => {
            Event::Start(Tag::Image { link_type, dest_url: rewrite_dest(dest_url), title, id })
        }
        other => other,
    });
    let mut output = String::new();
    html::push_html(&mut output, parser);
    output
}

#[cfg(test)]
mod tests {
    use super::render;

    #[test]
    fn rewrites_bare_relative_links_and_images() {
        let md = "[watch](watch.md) [home](/main.md) [ext](https://example.com) [anchor](#sec) [wasm](wasm:foo) ![pic](assets/a.png)";
        let html = render(md);
        println!("{html}");
        assert!(html.contains(r#"href="/watch.md""#));
        assert!(html.contains(r#"href="/main.md""#));
        assert!(html.contains(r#"href="https://example.com""#));
        assert!(html.contains("href=\"#sec\""));
        assert!(html.contains(r#"href="wasm:foo""#));
        assert!(html.contains(r#"src="/assets/a.png""#));
    }
}
