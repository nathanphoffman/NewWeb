import { makeLinkIcon } from './dom';
import type { FieldDef } from '../shared/types';
import { parseFields } from './fields';

// walks the preceding sibling HTML comments of a wasm link to extract script_reasoning, data keys, and field definitions
function parseWasmDirectives(anchor: HTMLAnchorElement): { desc: string; keys: string[]; fieldSections: FieldDef[][] } {
  let node: Node | null = anchor.parentElement;
  let desc = '';
  const keys: string[] = [];
  const fieldSections: FieldDef[][] = [];

  while (node) {
    node = node.previousSibling;

    if (!node) break;

    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') continue;

    if (node.nodeType !== Node.COMMENT_NODE) break;
    const text = (node as Comment).data.trim();

    // each pattern matches a comment's 'name: value' form and captures everything after the colon, including newlines
    const reasonMatch = text.match(/^script_reasoning\s*:\s*([\s\S]*)/i);
    const dataMatch   = text.match(/^data\s*:\s*([\s\S]*)/i);
    const fieldsMatch = text.match(/^fields\s*:\s*([\s\S]*)/i);

    if (reasonMatch) desc = reasonMatch[1].trim();

    if (dataMatch)   keys.push(...dataMatch[1].split(',').map(text => text.trim()).filter(Boolean));

    if (fieldsMatch) fieldSections.unshift(parseFields(fieldsMatch[1].trim()));
  }

  return { desc, keys, fieldSections };
}

// builds the gear button that opens a wasm link's info modal
function buildInfoButton(href: string, desc: string, keys: string[]): HTMLElement {
  const button = document.createElement('button');
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
  container.querySelectorAll('a[href]').forEach(element => {
    const anchor = element as HTMLAnchorElement;
    const href = anchor.getAttribute('href')!;

    if (href.startsWith('http://') || href.startsWith('https://')) {
      anchor.appendChild(makeLinkIcon());
    } else if (href.startsWith('wasm:')) {
      const { desc, keys, fieldSections } = parseWasmDirectives(anchor);
      anchor.dataset.desc = desc;
      anchor.dataset.keys = keys.join(',');

      if (fieldSections.length) anchor.dataset.fields = JSON.stringify(fieldSections);
      anchor.after(buildInfoButton(href, desc, keys));
    }
  });
}
