const DEFAULT_LABEL = 'A New Web Project';
const DEFAULT_HREF = 'https://newwebproject.dev';

// reads a <!-- [Label](target) --> comment from markdown and re-points the nav-bar logo,
// falling back to the site default if the page doesn't declare one. wasm: links aren't
// allowed here, so they're rendered as static (non-clickable) text instead.
export function applyLogoDirective(md: string): void {
  const match = md.match(/<!--\s*\[([^\]]+)\]\(([^)]+)\)\s*-->/);
  const label = match ? match[1].trim() : DEFAULT_LABEL;
  const href = match ? match[2].trim() : DEFAULT_HREF;
  const isWasm = href.startsWith('wasm:');
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  const el = document.createElement(isWasm ? 'span' : 'a');
  el.id = 'nw-logo';
  el.className = 'nw-logo';
  el.textContent = label;
  if (!isWasm) {
    (el as HTMLAnchorElement).href = href;
    if (!match) (el as HTMLAnchorElement).target = '_new';
  }
  if (isExternal) {
    el.insertAdjacentHTML('beforeend', `<span class="nw-link-icon" aria-hidden="true">🌐</span>`);
  }
  document.getElementById('nw-logo')!.replaceWith(el);
}
