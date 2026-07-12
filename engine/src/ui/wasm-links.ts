import type { FieldDef } from '../types.js';
import { parseFields } from './fields.js';

// walks the preceding sibling HTML comments of a wasm link to extract script_reasoning, data keys, and field definitions
function parseWasmDirectives(a: HTMLAnchorElement): { desc: string; keys: string[]; fieldSections: FieldDef[][] } {
  let node: Node | null = a.parentElement;
  let desc = '';
  const keys: string[] = [];
  const fieldSections: FieldDef[][] = [];
  while (node) {
    node = node.previousSibling;
    if (!node) break;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') continue;
    if (node.nodeType !== Node.COMMENT_NODE) break;
    const text = (node as Comment).data.trim();
    const reasonMatch = text.match(/^script_reasoning\s*:\s*([\s\S]*)/i);
    const dataMatch   = text.match(/^data\s*:\s*([\s\S]*)/i);
    const fieldsMatch = text.match(/^fields\s*:\s*([\s\S]*)/i);
    if (reasonMatch) desc = reasonMatch[1].trim();
    if (dataMatch)   keys.push(...dataMatch[1].split(',').map(s => s.trim()).filter(Boolean));
    if (fieldsMatch) fieldSections.unshift(parseFields(fieldsMatch[1].trim()));
  }
  return { desc, keys, fieldSections };
}

// adds a globe icon to external links and a gear info button next to wasm: links
export function annotateLinks(container: Element): void {
  container.querySelectorAll('a[href]').forEach(el => {
    const a = el as HTMLAnchorElement;
    const href = a.getAttribute('href')!;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      a.insertAdjacentHTML('beforeend', `<span class="nw-link-icon" aria-hidden="true">🌐</span>`);
    } else if (href.startsWith('wasm:')) {
      const { desc, keys, fieldSections } = parseWasmDirectives(a);
      a.dataset.desc = desc;
      a.dataset.keys = keys.join(',');
      if (fieldSections.length) a.dataset.fields = JSON.stringify(fieldSections);
      a.insertAdjacentHTML('afterend',
        `<button class="nw-wasm-info" data-href="${href}" data-desc="${desc}" data-keys="${keys.join(',')}" aria-label="Script info">⚙</button>`
      );
    }
  });
}
