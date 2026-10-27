import { BUTTON_TAG, HREF_ATTRIBUTE, HTTPS_PREFIX, HTTP_PREFIX, WASM_PREFIX } from '../shared/constants';
import { makeLinkIcon } from './dom';
import type { FieldDef } from '../shared/types';
import { parseFields } from './fields';

// matches a comment written as "name: value" and returns the value (which may span lines), or null if the name differs
function commentValue(text: string, name: string): string | null {
  // the name is built into the pattern; it comes from fixed strings in this file, never from page content
  const match = text.match(new RegExp(`^${name}\\s*:\\s*([\\s\\S]*)`, 'i'));

  return match ? match[1].trim() : null;
}

// splits a comma separated list into its non-empty, trimmed items
function splitList(text: string): string[] {
  return text.split(',').map(item => item.trim()).filter(Boolean);
}

// collects the HTML comments directly before a wasm link, skipping blank text between them
function precedingComments(anchor: HTMLAnchorElement): string[] {
  const comments: string[] = [];
  let node: Node | null = anchor.parentElement?.previousSibling ?? null;

  while (node) {
    const isBlankText = node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '';

    if (node.nodeType !== Node.COMMENT_NODE && !isBlankText) break;
    if (!isBlankText) comments.push((node as Comment).data.trim());
    node = node.previousSibling;
  }

  return comments;
}

// reads script_reasoning, data keys, and field definitions from the comments before a wasm link
function parseWasmDirectives(anchor: HTMLAnchorElement): { desc: string; keys: string[]; fieldSections: FieldDef[][] } {
  let desc = '';
  const keys: string[] = [];
  const fieldSections: FieldDef[][] = [];

  for (const text of precedingComments(anchor)) {
    const reason = commentValue(text, 'script_reasoning');
    const data = commentValue(text, 'data');
    const fields = commentValue(text, 'fields');

    if (reason !== null) desc = reason;
    if (data !== null) keys.push(...splitList(data));
    if (fields !== null) fieldSections.unshift(parseFields(fields));
  }

  return { desc, keys, fieldSections };
}

// builds the gear button that opens a wasm link's info modal
function buildInfoButton(href: string, desc: string, keys: string[]): HTMLElement {
  const button = document.createElement(BUTTON_TAG);
  button.className = 'nw-wasm-info';
  button.textContent = '⚙';
  button.dataset.href = href;
  button.dataset.desc = desc;
  button.dataset.keys = keys.join(',');
  button.setAttribute('aria-label', 'Script info');

  return button;
}

// adds a globe icon to external links and a gear info button next to wasm: links
export function annotateLinks(container: Element): void {
  // external links get a globe; wasm links get their directives read and an info button added
  container.querySelectorAll('a[href]').forEach(element => {
    const anchor = element as HTMLAnchorElement;
    const href = anchor.getAttribute(HREF_ATTRIBUTE)!;

    if (href.startsWith(HTTP_PREFIX) || href.startsWith(HTTPS_PREFIX)) {
      anchor.appendChild(makeLinkIcon());
    } else if (href.startsWith(WASM_PREFIX)) {
      const { desc, keys, fieldSections } = parseWasmDirectives(anchor);
      anchor.dataset.desc = desc;
      anchor.dataset.keys = keys.join(',');

      if (fieldSections.length) anchor.dataset.fields = JSON.stringify(fieldSections);
      anchor.after(buildInfoButton(href, desc, keys));
    }
  });
}
