// Lettered lists (`a)`, `a.`, `A)`, `A.`), following Pandoc's "fancy_lists" syntax.
//
// Standard markdown only has numbered lists, so this works in two steps:
// 1. Before parsing, `swap_letters_for_numbers` replaces each letter marker with `1`, so the
//    parser builds a normal numbered list. The swap keeps every character in the same
//    position, so the parser's positions still point at the right spot in the original text.
// 2. While writing HTML, `lettered_list_tag` is used in place of the plain `<ol>` for any
//    list whose first marker was one of those swapped letters.

use std::collections::HashSet;

pub struct SwappedMarkdown {
    // the markdown with letter markers replaced by `1`
    pub text: String,
    // byte positions of every letter that was replaced
    pub swapped_at: HashSet<usize>,
}

pub fn swap_letters_for_numbers(md: &str) -> SwappedMarkdown {
    let mut text = String::with_capacity(md.len());
    let mut swapped_at = HashSet::new();
    // the fence (``` or ~~~) of the code block we're inside, if any. Code is left untouched.
    let mut open_fence: Option<&str> = None;

    for line in md.split_inclusive('\n') {
        let trimmed = line.trim_start();
        if let Some(fence) = open_fence {
            if trimmed.starts_with(fence) {
                open_fence = None;
            }
        } else if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            open_fence = Some(&trimmed[..3]);
        } else if let Some(letter_pos) = find_letter_marker(line) {
            swapped_at.insert(text.len() + letter_pos);
            text.push_str(&line[..letter_pos]);
            text.push('1');
            text.push_str(&line[letter_pos + 1..]);
            continue;
        }
        text.push_str(line);
    }

    SwappedMarkdown { text, swapped_at }
}

// If `line` starts with a letter marker, returns the position of the letter in the line.
// Following Pandoc, a capital letter with a period needs two spaces after it, so initials
// like "B. Russell" at the start of a line stay plain text.
fn find_letter_marker(line: &str) -> Option<usize> {
    let indent = line.len() - line.trim_start_matches(' ').len();
    let rest = &line.as_bytes()[indent..];
    if rest.len() < 3 || !rest[0].is_ascii_alphabetic() || !matches!(rest[1], b')' | b'.') {
        return None;
    }
    let letter = rest[0];
    let punctuation = rest[1];
    let spaces_needed = if letter.is_ascii_uppercase() && punctuation == b'.' { 2 } else { 1 };
    let spaces = rest[2..].iter().take_while(|&&b| b == b' ').count();
    let has_content = rest.len() > 2 + spaces;
    if spaces >= spaces_needed && has_content {
        Some(indent)
    } else {
        None
    }
}

// The opening `<ol>` tag for a lettered list, e.g. `c)` gives `<ol type="a" start="3">`.
pub fn lettered_list_tag(letter: u8) -> String {
    let (list_type, start) = if letter.is_ascii_uppercase() {
        ("A", letter - b'A' + 1)
    } else {
        ("a", letter - b'a' + 1)
    };
    if start == 1 {
        format!("<ol type=\"{list_type}\">\n")
    } else {
        format!("<ol type=\"{list_type}\" start=\"{start}\">\n")
    }
}
