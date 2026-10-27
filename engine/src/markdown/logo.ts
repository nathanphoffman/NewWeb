import { makeLinkIcon } from '../ui/dom';
import { toRootRelative } from '../shared/utility';

const DEFAULT_LABEL = 'A New Web Project';
const DEFAULT_HREF = 'main';

// reads a <!-- [Label](target) --> comment from markdown and re-points the nav-bar logo,
// falling back to the site default if the page doesn't declare one. wasm: links aren't
// allowed here, so they're rendered as static (non-clickable) text instead.
export function applyLogoDirective(markdown: string): void {
  // matches <!-- [Label](target) --> and captures the label and the target
  const match = markdown.match(/<!--\s*\[([^\]]+)\]\(([^)]+)\)\s*-->/);
  const label = match ? match[1].trim() : DEFAULT_LABEL;
  const href = match ? match[2].trim() : DEFAULT_HREF;
  const isWasm = href.startsWith('wasm:');
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  const current = document.getElementById('nw-logo')!;
  const isFirstLoad = current.classList.contains('nw-logo-hidden');

  const element = document.createElement(isWasm ? 'span' : 'a');
  element.id = 'nw-logo';
  element.className = isFirstLoad ? 'nw-logo nw-logo-hidden' : 'nw-logo';
  element.textContent = label;

  if (!isWasm) {
    // written as-is into the DOM (not just read by our click handler), so it must already
    // be root-relative for a raw browser navigation — new tab, view-source, no-JS — to land
    // on the right page regardless of how deep the current page is nested
    (element as HTMLAnchorElement).href = isExternal ? href : toRootRelative(href);
  }

  if (isExternal) {
    element.appendChild(makeLinkIcon());
  }

  current.replaceWith(element);

  // on the very first load the bar starts blank; fade the real label in once it's known
  if (isFirstLoad) requestAnimationFrame(() => requestAnimationFrame(() => element.classList.remove('nw-logo-hidden')));
}
