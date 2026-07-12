import { showSpinner, hideSpinner } from './ui/index.js';

let GoTiny: (new () => Go) | null = null;

// lazily injects the TinyGo wasm_exec runtime script; no-ops if already loaded
async function loadTinyRuntime(): Promise<void> {
  if (GoTiny) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'engine/lib/wasm_exec_tiny.js';
    s.onload = () => { GoTiny = Go; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// fetches a wasm binary and runs it using the TinyGo runtime
export async function loadAndExecute(file: string): Promise<void> {
  await loadTinyRuntime();
  const bytes = await fetch(file).then(r => r.arrayBuffer());
  const go = new GoTiny!();
  const module = await WebAssembly.instantiate(bytes, go.importObject);
  await go.run(module.instance);
}

// handles a click on a wasm: link — shows spinner, loads and executes the wasm file, then hides spinner
export async function handleWasm(a: HTMLAnchorElement): Promise<void> {
  if (a.dataset.pending) return;
  a.dataset.pending = 'true';
  showSpinner();

  const { file } = parseWasmUrl(a.getAttribute('href')!);
  await loadAndExecute(file);

  delete a.dataset.pending;
  hideSpinner();
}

// parses a "wasm:file.wasm?key=val" href into a file path and query params object
export function parseWasmUrl(href: string): { file: string; params: Record<string, string> } {
  const withoutProtocol = href.replace('wasm:', '');
  const [file, qs] = withoutProtocol.split('?');
  const params: Record<string, string> = {};
  if (qs) qs.split('&').forEach(p => {
    const [k, v] = p.split('=');
    params[k] = v;
  });
  return { file, params };
}
