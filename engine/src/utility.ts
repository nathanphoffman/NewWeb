// walks up from the clicked element to find the nearest <a> ancestor, or null if none
export function extractALink(e: MouseEvent) {
  const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
  return a;
}

// safely returns the href attribute from an anchor, or undefined if the anchor is null
export function extractHrefAttribute(e: MouseEvent, a: HTMLAnchorElement | null) {
  if (!a) return;
  const href = a?.getAttribute('href');
  return href;
}

// resolves a bare markdown/partial path against the site root instead of the current
// page's (possibly pretty-URL-rewritten) location — so a link or include written as
// "blog/coding.md" always means /blog/coding.md, no matter how deep the current page lives
export function toRootRelative(path: string): string {
  if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `/${path}`;
}
