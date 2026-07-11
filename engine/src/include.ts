import { toRootRelative } from './utility.js';

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

// parses the comma-separated body of an <!-- include: ... --> directive into its file list and optional sort/sort_dir/limit_to fields
function parseIncludeDirective(body: string): IncludeDirective {
  const files: string[] = [];
  let sortMarker: string | null = null;
  let sortDir: 'asc' | 'desc' = 'asc';
  let limitTo: number | null = null;

  for (const part of body.split(',')) {
    const token = part.trim();
    if (/^sort_dir\s*:/i.test(token)) {
      if (token.replace(/^sort_dir\s*:/i, '').trim().toLowerCase() === 'desc') sortDir = 'desc';
    } else if (/^sort\s*:/i.test(token)) {
      sortMarker = token.replace(/^sort\s*:/i, '').trim().replace(/^["']|["']$/g, '');
    } else if (/^limit_to\s*:/i.test(token)) {
      const n = parseInt(token.replace(/^limit_to\s*:/i, '').trim(), 10);
      if (!isNaN(n)) limitTo = n;
    } else if (token) {
      files.push(token);
    }
  }
  return { files, sortMarker, sortDir, limitTo };
}

// splits content into entries on lines matching the marker (top-level "#" headings, or any literal line prefix), pairing each with the text after the marker as its sort key. Content before the first match is dropped.
function splitIntoEntries(content: string, marker: string): Entry[] {
  const lines = content.split('\n');
  const isHeadingMarker = marker === '#';
  const boundaries: { index: number; key: string }[] = [];

  lines.forEach((line, i) => {
    if (isHeadingMarker) {
      const m = line.match(/^#(?!#)\s+(.+)$/);
      if (m) boundaries.push({ index: i, key: m[1].trim() });
    } else if (line.trim().startsWith(marker)) {
      const key = line.trim().slice(marker.length).trim().replace(/-->\s*$/, '').trim();
      boundaries.push({ index: i, key });
    }
  });

  return boundaries.map((b, i) => {
    const end = i + 1 < boundaries.length ? boundaries[i + 1].index : lines.length;
    return { key: b.key, text: lines.slice(b.index, end).join('\n').trim() };
  });
}

// expands <!-- include: file1.md, file2.md, sort: #, sort_dir: desc, limit_to: N --> directives, either
// concatenating the referenced files in order, or (with "sort:") splitting each into entries and merging
// them into one sorted, optionally truncated listing. Resolves exactly one level of nested include directives.
export async function processIncludes(raw: string, depth = 0): Promise<string> {
  const pattern = /<!--\s*include\s*:\s*(.+?)\s*-->/g;
  const matches = [...raw.matchAll(pattern)];
  if (matches.length === 0) return raw;

  const directives = matches.map(m => parseIncludeDirective(m[1]));
  const allFiles = [...new Set(directives.flatMap(d => d.files))];

  const contentMap = new Map<string, string>();
  await Promise.all(allFiles.map(async url => {
    let text = await fetch(toRootRelative(url)).then(r => r.text());
    if (depth === 0 && /<!--\s*include\s*:\s*(.+?)\s*-->/.test(text)) {
      text = await processIncludes(text, depth + 1);
    }
    contentMap.set(url, text);
  }));

  let i = 0;
  return raw.replace(pattern, () => {
    const directive = directives[i++];
    const fileContents = directive.files.map(f => contentMap.get(f) ?? '');

    if (!directive.sortMarker) {
      return fileContents.join('\n\n');
    }

    const entries = fileContents.flatMap(content => splitIntoEntries(content, directive.sortMarker!));
    entries.sort((a, b) => a.key.localeCompare(b.key));
    if (directive.sortDir === 'desc') entries.reverse();
    const limited = directive.limitTo != null ? entries.slice(0, directive.limitTo) : entries;
    return limited.map(e => e.text).join('\n\n');
  });
}
