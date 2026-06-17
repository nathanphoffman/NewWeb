export function extractALink(e: MouseEvent) {
  const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
  return a;
}

export function extractHrefAttribute(e: MouseEvent, a: HTMLAnchorElement | null) {
  if (!a) return;
  const href = a?.getAttribute('href');
  return href;
}
