import { HTTPS_PREFIX, HTTP_PREFIX, SPAN_TAG, WASM_PREFIX } from '../shared/constants';
import { makeLinkIcon } from '../ui/dom';
import { toRootRelative } from '../shared/utility';

const DEFAULT_LABEL = 'A New Web Project';
const DEFAULT_HREF = 'main';

// finds the label and target in a <!-- [Label](target) --> comment, falling back to the site default
function parseLogoDirective(markdown: string): { label: string; href: string } {
  // matches <!-- [Label](target) --> and captures the label and the target
  const match = markdown.match(/<!--\s*\[([^\]]+)\]\(([^)]+)\)\s*-->/);

  return {
    label: match ? match[1].trim() : DEFAULT_LABEL,
    // use the declared label and target when the page has the comment, otherwise the site defaults
    href: match ? match[2].trim() : DEFAULT_HREF,
  };
}

// builds the logo element: a link, or plain text for wasm: targets, with a globe on external links
function buildLogo(label: string, href: string, isFirstLoad: boolean): HTMLElement {
  const isWasm = href.startsWith(WASM_PREFIX);
  const isExternal = href.startsWith(HTTP_PREFIX) || href.startsWith(HTTPS_PREFIX);
  const element = document.createElement(isWasm ? SPAN_TAG : 'a');

  element.id = 'nw-logo';
  element.className = isFirstLoad ? 'nw-logo nw-logo-hidden' : 'nw-logo';
  element.textContent = label;

  if (!isWasm) {
    // written as-is into the DOM (not just read by our click handler), so it must already
    // be root-relative for a raw browser navigation — new tab, view-source, no-JS — to land
    // on the right page regardless of how deep the current page is nested
    (element as HTMLAnchorElement).href = isExternal ? href : toRootRelative(href);
  }

  if (isExternal) element.appendChild(makeLinkIcon());

  return element;
}

// reads a <!-- [Label](target) --> comment from markdown and re-points the nav-bar logo,
// falling back to the site default if the page doesn't declare one. wasm: links aren't
// allowed here, so they're rendered as static (non-clickable) text instead.
export function applyLogoDirective(markdown: string): void {
  const { label, href } = parseLogoDirective(markdown);
  const current = document.getElementById('nw-logo')!;
  const isFirstLoad = current.classList.contains('nw-logo-hidden');
  const element = buildLogo(label, href, isFirstLoad);

  current.replaceWith(element);

  // on the very first load the bar starts blank; fade the real label in once it's known
  if (isFirstLoad) requestAnimationFrame(() => requestAnimationFrame(() => element.classList.remove('nw-logo-hidden')));
}
