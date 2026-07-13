const DEFAULT_LABEL = 'A New Web Project';
const DEFAULT_HREF = 'main';

// reads a <!-- [Label](target) --> comment from markdown and re-points the nav-bar logo,
// falling back to the site default if the page doesn't declare one. wasm: links aren't
// allowed here, so they're rendered as static (non-clickable) text instead.
export function applyLogoDirective(md: string): void {
  const match = md.match(/<!--\s*\[([^\]]+)\]\(([^)]+)\)\s*-->/);
  const label = match ? match[1].trim() : DEFAULT_LABEL;
  const href = match ? match[2].trim() : DEFAULT_HREF;
  const isWasm = href.startsWith('wasm:');
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  const current = document.getElementById('nw-logo')!;
  const isFirstLoad = current.classList.contains('nw-logo-hidden');

  const el = document.createElement(isWasm ? 'span' : 'a');
  el.id = 'nw-logo';
  el.className = isFirstLoad ? 'nw-logo nw-logo-hidden' : 'nw-logo';
  el.textContent = label;
  if (!isWasm) {
    (el as HTMLAnchorElement).href = href;
  }
  if (isExternal) {
    el.insertAdjacentHTML('beforeend', `<span class="nw-link-icon" aria-hidden="true">🌐</span>`);
  }
  current.replaceWith(el);
  // on the very first load the bar starts blank; fade the real label in once it's known
  if (isFirstLoad) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('nw-logo-hidden')));
}
