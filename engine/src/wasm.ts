import { showToast, showSpinner, hideSpinner } from './ui.js';

const authTokens: Record<string, string> = {};

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

// makes a same-origin authenticated POST from within a wasm module; blocks cross-domain requests
export async function wasmFetch(url: string, data: unknown): Promise<string | null> {
  const requestDomain = new URL(url).hostname;
  const pageDomain = window.location.hostname;
  if (requestDomain !== pageDomain) {
    showToast('Cross-domain fetch prohibited', 'error');
    return null;
  }
  const token = authTokens[window.location.hostname];
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then(r => r.text());
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
