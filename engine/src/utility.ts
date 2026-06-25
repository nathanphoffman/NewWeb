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
