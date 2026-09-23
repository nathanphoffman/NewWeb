// The markdown → HTML engine, compiled to wasm and called from JavaScript as `render(md)`.
//
// Each feature lives in its own file:
// - options.rs:      which markdown features are turned on
// - links.rs:        rewriting relative link/image paths
// - letter_lists.rs: `a)` / `A.` style lettered lists
// - tests.rs:        tests (run with `cargo test`)

mod letter_lists;
mod links;
mod options;
#[cfg(test)]
mod tests;

use pulldown_cmark::{html, CowStr, Event, Parser, Tag};
use std::ops::Range;
use wasm_bindgen::prelude::*;

use letter_lists::{lettered_list_tag, swap_letters_for_numbers, SwappedMarkdown};
use links::make_root_relative;
use options::markdown_options;

// `#[wasm_bindgen]` is what makes this function callable from JavaScript.
#[wasm_bindgen]
pub fn render(md: &str) -> String {
    let swapped = swap_letters_for_numbers(md);

    // The parser produces a stream of "events" (start of a list, some text, end of a link, ...),
    // each with the position in the text it came from. We adjust some of them, then the html
    // writer turns the stream into an HTML string.
    let events = Parser::new_ext(&swapped.text, markdown_options())
        .into_offset_iter()
        .map(|(event, position)| adjust_event(event, position, md, &swapped));

    let mut output = String::new();
    html::push_html(&mut output, events);
    output
}

// Changes a single parser event before it's turned into HTML. Anything not listed passes through.
fn adjust_event<'a>(event: Event<'a>, position: Range<usize>, original: &str, swapped: &SwappedMarkdown) -> Event<'a> {
    match event {
        // a numbered list that was really a lettered one: swap its `<ol>` for `<ol type="a">`
        Event::Start(Tag::List(Some(_))) => {
            let marker = first_marker_position(&swapped.text, position);
            if swapped.swapped_at.contains(&marker) {
                Event::Html(CowStr::from(lettered_list_tag(original.as_bytes()[marker])))
            } else {
                event
            }
        }
        Event::Start(Tag::Link { link_type, dest_url, title, id }) => {
            Event::Start(Tag::Link { link_type, dest_url: make_root_relative(dest_url), title, id })
        }
        Event::Start(Tag::Image { link_type, dest_url, title, id }) => {
            Event::Start(Tag::Image { link_type, dest_url: make_root_relative(dest_url), title, id })
        }
        other => other,
    }
}

// A list's position can include leading indentation; this skips past it to the first marker.
fn first_marker_position(text: &str, position: Range<usize>) -> usize {
    let list_text = &text[position.clone()];
    position.start + list_text.len() - list_text.trim_start().len()
}
