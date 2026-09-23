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

#[test]
fn renders_letter_lists() {
    let md = "Rules:\n\na) **first**\nb) second\n\n1. one\n   a. nested\n\nC) upper\n\nB. Russell said\n\n```\na) code\n```\n";
    let html = render(md);
    println!("{html}");
    assert!(html.contains("<ol type=\"a\">\n<li><strong>first</strong></li>\n<li>second</li>\n</ol>"));
    assert!(html.contains("<ol>\n<li>one<ol type=\"a\">\n<li>nested</li>"));
    assert!(html.contains("<ol type=\"A\" start=\"3\">\n<li>upper</li>"));
    assert!(html.contains("<p>B. Russell said</p>"));
    assert!(html.contains("<code>a) code\n</code>"));
}

#[test]
fn letter_list_after_numbered_list() {
    let md = "1) **Mechanical** (Programs)\n2) **Pattern-Matching** (AI)\n\nThis also led me to a few rules:\na) An intelligence \"thinks\"\nb) An intelligence can\n";
    let html = render(md);
    println!("{html}");
    assert!(html.contains("<p>This also led me to a few rules:</p>\n<ol type=\"a\">\n<li>An intelligence “thinks”</li>\n<li>An intelligence can</li>\n</ol>"));
}
