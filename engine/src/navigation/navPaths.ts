import { MARKDOWN_EXTENSION } from '../shared/constants';
import { toRootRelative } from '../shared/utility';

const COMMON_TLDS = ['.com', '.org', '.net', '.io', '.dev', '.app', '.co', '.edu', '.gov', '.uk', '.ca', '.au'];

// returns true if the href contains a common TLD, suggesting it's an external URL missing https://
export function looksLikeBareUrl(href: string): boolean {
  return COMMON_TLDS.some(topLevelDomain => href.includes(topLevelDomain));
}

// reads a <!-- refresh: <file> --> comment from markdown, returning the wasm file path if present
export function extractRefreshWasm(markdown: string): string | null {
  // matches <!-- refresh: file.wasm --> and captures the file name
  const match = markdown.match(/<!--\s*refresh\s*:\s*(\S+)\s*-->/i);

  return match ? match[1] : null;
}

// splits a path like "page.md#section" into ["page.md", "section"]
export function splitAnchor(path: string): [string, string | null] {
  const index = path.indexOf('#');

  return index === -1 ? [path, null] : [path.slice(0, index), path.slice(index + 1)];
}

// strips a trailing .md so the address bar shows the pretty path
export function prettyUrl(mdPath: string, anchor: string | null): string {
  const base = mdPath.endsWith(MARKDOWN_EXTENSION) ? mdPath.slice(0, -MARKDOWN_EXTENSION.length) : mdPath;
  const withSlash = base.startsWith('/') ? base : `/${base}`;

  return anchor ? `${withSlash}#${anchor}` : withSlash;
}

// adds a missing .md extension and makes the path root-relative
export function toMarkdownPath(path: string): string {
  return toRootRelative(path.endsWith('.md') ? path : `${path}.md`);
}
