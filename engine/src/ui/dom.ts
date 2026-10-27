import { SPAN_TAG, TRUE_STRING } from '../shared/constants';
// creates an element with an optional class name and text, so builders don't repeat three lines per element
export function makeElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (className) element.className = className;

  if (text) element.textContent = text;

  return element;
}

// parses trusted svg markup into an element without going through innerHTML
export function parseSvg(markup: string): SVGSVGElement {
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');

  return document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement;
}

// builds the globe marker shown next to external links
export function makeLinkIcon(): HTMLElement {
  const icon = document.createElement(SPAN_TAG);
  icon.className = 'nw-link-icon';
  icon.textContent = '🌐';
  icon.setAttribute('aria-hidden', TRUE_STRING);

  return icon;
}
