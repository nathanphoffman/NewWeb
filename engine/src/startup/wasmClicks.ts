import { WASM_PREFIX } from "../shared/constants";
import type { FieldDef } from "../shared/types";
import { showFormModal } from "../ui/overlays/formModal";
import { handleWasm } from "./wasmLoader";
import { store } from "./engineCode";
import { updateViewDataBtn } from "./markdownUpdates";

let allowedKeys = new Set<string>();

// true while a wasm link is running and has declared (or been given through a form) access to this key
export function isKeyAllowed(key: string): boolean {
  return allowedKeys.has(key);
}

// splits a comma separated data-keys attribute into key names
function parseKeys(attribute: string | undefined): string[] {
  return (attribute ?? '').split(',').filter(Boolean);
}

// runs the wasm for a link, then locks key access again once it finishes
function runWasmLink(anchor: HTMLAnchorElement, keys: string[], formKeys: string[] = []): void {
  allowedKeys = new Set([...keys, ...formKeys]);

  handleWasm(anchor).finally(() => {
    for (const entryKey of formKeys) store.delete(entryKey);
    allowedKeys = new Set();

    if (formKeys.length > 0) updateViewDataBtn();
  });
}

// saves the submitted form values to the store and runs the wasm with access to them
function submitWasmForm(anchor: HTMLAnchorElement, values: Record<string, string>): void {
  for (const [entryKey, value] of Object.entries(values)) store.set(entryKey, value);
  runWasmLink(anchor, parseKeys(anchor.dataset.keys), Object.keys(values));
}

// intercepts wasm: link clicks — shows a form if fields are declared, then executes the wasm with scoped key access
export function handleWASMClick(event: MouseEvent, anchor: HTMLAnchorElement, href: string) {
  if (!href.startsWith(WASM_PREFIX)) return;

  event.preventDefault();
  const fieldsJson = anchor.dataset.fields;

  if (!fieldsJson) {
    runWasmLink(anchor, parseKeys(anchor.dataset.keys));

    return;
  }

  const fieldSections = JSON.parse(fieldsJson) as FieldDef[][];
  const linkText = anchor.textContent?.trim() ?? 'Submit';
  showFormModal(linkText, fieldSections, values => submitWasmForm(anchor, values));
}
