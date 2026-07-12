// converts heading text to a lowercase URL-safe id slug
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

// assigns slugified id attributes to headings that don't already have one, de-duplicating with a counter
export function addHeadingIds(container: Element): void {
  const seen = new Map<string, number>();
  container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6').forEach(h => {
    if (h.id) return;
    const base = slugify(h.textContent ?? '');
    if (!base) return;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    h.id = n === 0 ? base : `${base}-${n}`;
  });
}
