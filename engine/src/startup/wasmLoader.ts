import { HREF_ATTRIBUTE, TRUE_STRING, WASM_PREFIX } from '../shared/constants';
import { showSpinner, hideSpinner } from '../ui/overlays/spinner';
import { toRootRelative } from '../shared/utility';

let GoTiny: (new () => Go) | null = null;

// lazily injects the TinyGo wasm_exec runtime script; no-ops if already loaded
async function loadTinyRuntime(): Promise<void> {
  if (GoTiny) return;
  // wrapped in a promise because script loading is event based (onload/onerror) rather than awaitable
  await new Promise<void>((resolve, reject) => {
    const text = document.createElement('script');

    // a relative <script src> resolves against the *current page's* URL, which is wrong
    // once the SPA has navigated into a subdirectory — this asset always lives at site root
    text.src = new URL('/engine/lib/wasm_exec_tiny.js', location.origin).toString();
    text.onload = () => { GoTiny = Go; resolve(); };
    text.onerror = reject;
    document.head.appendChild(text);
  });
}

// fetches a wasm binary and runs it using the TinyGo runtime
async function loadAndExecute(file: string): Promise<void> {
  await loadTinyRuntime();

  // wasm: links are authored root-relative (e.g. "src/order.wasm" means /src/order.wasm),
  // same convention as markdown links — fetch() would otherwise resolve it against
  // whatever pretty path the SPA has currently navigated to
  const bytes = await fetch(toRootRelative(file)).then(response => response.arrayBuffer());

  const go = new GoTiny!();
  const module = await WebAssembly.instantiate(bytes, go.importObject);
  await go.run(module.instance);
}

// handles a click on a wasm: link — shows spinner, loads and executes the wasm file, then hides spinner
export async function handleWasm(anchor: HTMLAnchorElement): Promise<void> {
  if (anchor.dataset.pending) return;
  anchor.dataset.pending = TRUE_STRING;
  showSpinner();

  const { file } = parseWasmUrl(anchor.getAttribute(HREF_ATTRIBUTE)!);
  await loadAndExecute(file);

  delete anchor.dataset.pending;
  hideSpinner();
}

// parses a "wasm:file.wasm?key=val" href into a file path and query params object
function parseWasmUrl(href: string): { file: string; params: Record<string, string> } {
  const withoutProtocol = href.replace(WASM_PREFIX, '');
  const [file, queryString] = withoutProtocol.split('?');
  const params: Record<string, string> = {};

  if (queryString) queryString.split('&').forEach(p => {
    const [k, v] = p.split('=');
    params[k] = v;
  });

  return { file, params };
}
