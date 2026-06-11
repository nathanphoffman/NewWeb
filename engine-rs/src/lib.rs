use pulldown_cmark::{html, Options, Parser};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn render(md: &str) -> String {
    let parser = Parser::new_ext(md, Options::all());
    let mut output = String::new();
    html::push_html(&mut output, parser);
    output
}
