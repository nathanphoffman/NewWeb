import { BLANK_LINE, DECIMAL_RADIX } from '../shared/constants';
import { toRootRelative } from '../shared/utility';

interface IncludeDirective {
  files: string[];
  sortMarker: string | null;
  sortDir: 'asc' | 'desc';
  limitTo: number | null;
}

interface Entry {
  key: string;
  text: string;
}

// matches <!-- include: files... --> and captures everything after the colon
const INCLUDE_PATTERN = /<!--\s*include\s*:\s*(.+?)\s*-->/g;

// matches a quote at the start or end of a value, so "# Title" and '# Title' both lose their quotes
const WRAPPING_QUOTES = /^["']|["']$/g;

// reads an option written as "name: value" and returns the value, or null when the token is a different option.
// The pattern is anchored with a colon so 'sort_dir' isn't mistaken for 'sort'.
function optionValue(token: string, name: string): string | null {
  // the name is built into the pattern; it only ever comes from the fixed option names used in this file
  const match = token.match(new RegExp(`^${name}\\s*:\\s*(.*)$`, 'i'));

  return match ? match[1].trim() : null;
}

// applies one comma separated token to the directive: a sort/sort_dir/limit_to option, or else a file name
function applyToken(directive: IncludeDirective, token: string): void {
  const sortDir = optionValue(token, 'sort_dir');
  const sortMarker = optionValue(token, 'sort');
  const limitTo = optionValue(token, 'limit_to');

  if (sortDir !== null) {
    if (sortDir.toLowerCase() === 'desc') directive.sortDir = 'desc';
  } else if (sortMarker !== null) {
    directive.sortMarker = sortMarker.replace(WRAPPING_QUOTES, '');
  } else if (limitTo !== null) {
    const limit = parseInt(limitTo, DECIMAL_RADIX);

    if (!Number.isNaN(limit)) directive.limitTo = limit;
  } else if (token) {
    directive.files.push(token);
  }
}

// parses the comma-separated body of an <!-- include: ... --> directive into its file list and optional sort/sort_dir/limit_to fields
function parseIncludeDirective(body: string): IncludeDirective {
  const directive: IncludeDirective = { files: [], sortMarker: null, sortDir: 'asc', limitTo: null };

  for (const part of body.split(',')) applyToken(directive, part.trim());

  return directive;
}

// returns the sort key when the line starts a new entry for this marker, or null otherwise.
// A "#" marker means top-level headings; anything else is a literal line prefix, optionally wrapped in an HTML comment.
function entryKeyOf(line: string, marker: string): string | null {
  if (marker === '#') {
    // matches a top-level '# Heading' line only: the (?!#) rejects '##' subheadings, and the heading text is captured
    const heading = line.match(/^#(?!#)\s+(.+)$/);

    return heading ? heading[1].trim() : null;
  }

  // strips an optional wrapping <!-- --> from the line so markers can be written as HTML comments
  const stripped = line.trim().replace(/^<!--\s*/, '').replace(/\s*-->$/, '').trim();

  return stripped.startsWith(marker) ? stripped.slice(marker.length).trim() : null;
}

// splits content into entries on lines matching the marker, pairing each with the text after the marker as its sort key.
// Content before the first match is dropped.
function splitIntoEntries(content: string, marker: string): Entry[] {
  const lines = content.split('\n');
  const boundaries: { index: number; key: string }[] = [];

  lines.forEach((line, index) => {
    const key = entryKeyOf(line, marker);

    if (key !== null) boundaries.push({ index, key });
  });

  return boundaries.map((boundary, position) => {
    const next = boundaries[position + 1];
    const end = next ? next.index : lines.length;

    return { key: boundary.key, text: lines.slice(boundary.index, end).join('\n').trim() };
  });
}

// renders one directive: the files joined in order, or (with a sort marker) their entries merged, sorted and truncated
function renderDirective(directive: IncludeDirective, contents: Map<string, string>): string {
  const fileContents = directive.files.map(file => contents.get(file) ?? '');
  const marker = directive.sortMarker;

  if (!marker) return fileContents.join(BLANK_LINE);

  const entries = fileContents.flatMap(content => splitIntoEntries(content, marker));
  entries.sort((first, second) => first.key.localeCompare(second.key));
  if (directive.sortDir === 'desc') entries.reverse();

  const limited = directive.limitTo != null ? entries.slice(0, directive.limitTo) : entries;

  return limited.map(entry => entry.text).join(BLANK_LINE);
}

// fetches every file the directives mention; includes found inside a fetched file are expanded once more (depth 0 only)
async function fetchIncludedFiles(files: string[], depth: number): Promise<Map<string, string>> {
  const contents = new Map<string, string>();

  // files are fetched in parallel since they don't depend on each other
  await Promise.all(files.map(async address => {
    let text = await fetch(toRootRelative(address)).then(response => response.text());

    // only expands includes found inside an included file once, so circular includes can't loop forever
    if (depth === 0 && new RegExp(INCLUDE_PATTERN.source).test(text)) {
      text = await processIncludes(text, depth + 1);
    }

    contents.set(address, text);
  }));

  return contents;
}

// expands <!-- include: file1.md, file2.md, sort: #, sort_dir: desc, limit_to: N --> directives, either
// concatenating the referenced files in order, or (with "sort:") splitting each into entries and merging
// them into one sorted, optionally truncated listing. Resolves exactly one level of nested include directives.
export async function processIncludes(rawText: string, depth = 0): Promise<string> {
  const matches = [...rawText.matchAll(INCLUDE_PATTERN)];

  if (matches.length === 0) return rawText;

  const directives = matches.map(match => parseIncludeDirective(match[1]));
  const allFiles = [...new Set(directives.flatMap(directive => directive.files))];
  const contents = await fetchIncludedFiles(allFiles, depth);

  let next = 0;

  return rawText.replace(INCLUDE_PATTERN, () => renderDirective(directives[next++], contents));
}
