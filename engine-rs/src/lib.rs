use pulldown_cmark::{html, Options, Parser};
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

#[wasm_bindgen]
pub fn render(md: &str) -> String {
    let parser = Parser::new_ext(md, render_options());
    let mut output = String::new();
    html::push_html(&mut output, parser);
    output
}
