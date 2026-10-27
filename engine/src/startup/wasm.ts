import { makeElement } from "../ui/dom";
import { navigateTo, navigateWithData } from "../navigation/nav";
import { replacePage } from "../navigation/navLinks";
import { handleRedirect } from "../navigation/redirect";
import type { FieldDef } from "../shared/types";
import { hydrateExistingContent, scrollToAnchor } from "../ui/page";
import { toMarkdownPath } from "../navigation/navPaths";
import { showFormModal, showMarkdownModal } from "../ui/overlays/modals";
import { showToast } from "../ui/overlays/toast";
import { handleWasm } from "./wasmLoader";
import { store } from "./engineCode";
import { updateViewDataBtn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';

let allowedKeys = new Set<string>();

// splits a comma separated data-keys attribute into key names
function parseKeys(attribute: string | undefined): string[] {
  return (attribute ?? '').split(',').filter(Boolean);
}

// runs the wasm for a link, then locks key access again once it finishes
function runWasmLink(a: HTMLAnchorElement, keys: string[], formKeys: string[] = []): void {
  allowedKeys = new Set([...keys, ...formKeys]);

  handleWasm(a).finally(() => {
    for (const key of formKeys) store.delete(key);
    allowedKeys = new Set();

    if (formKeys.length > 0) updateViewDataBtn();
  });
}

// saves the submitted form values to the store and runs the wasm with access to them
function submitWasmForm(a: HTMLAnchorElement, values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) store.set(key, value);
  runWasmLink(a, parseKeys(a.dataset.keys), Object.keys(values));
}

// intercepts wasm: link clicks — shows a form if fields are declared, then executes the wasm with scoped key access
export function handleWASMClick(e: MouseEvent, a: HTMLAnchorElement, href: string) {
  if (!href.startsWith('wasm:')) return;

  e.preventDefault();
  const fieldsJson = a.dataset.fields;

  if (!fieldsJson) {
    runWasmLink(a, parseKeys(a.dataset.keys));

    return;
  }

  const fieldSections = JSON.parse(fieldsJson) as FieldDef[][];
  const linkText = a.textContent?.trim() ?? 'Submit';
  showFormModal(linkText, fieldSections, values => submitWasmForm(a, values));
}

// sends http(s) urls through the redirect countdown and everything else through in-app navigation
function redirectOrNavigate(url: string, reason?: string): void {
  if (url.startsWith('http://') || url.startsWith('https://')) handleRedirect(url, reason);
  else navigateTo(url);
}

// exposes the host API that wasm modules call on window.newweb
function installHostApi(): void {
  window.newweb = {
    redirect: redirectOrNavigate,
    replace: (url) => replacePage(url),
    info:    (md) => showToast(md, 'info'),
    error:   (md) => showToast(md, 'error'),
    more:    (md) => showMarkdownModal(md),
    load:    (url, data) => navigateWithData(url, data),
    store:   (key, value) => { store.set(key, value); updateViewDataBtn(); },
    get:     (key) => allowedKeys.has(key) ? (store.get(key) ?? '') : '',
  };
}

// build-static.js writes real ".html" files (e.g. "about.html", "blog/post.html") so the
// output works on static hosts with no pretty-URL rewriting; normalize a raw file path
// back to the pretty form so it matches how the SPA's own links/history always look
function prettyLocationPath(): string {
  if (location.pathname === '/index.html') return '/';

  if (location.pathname.endsWith('.html')) return location.pathname.slice(0, -'.html'.length);

  return location.pathname;
}

// build-static.js stamps statically pre-rendered pages with the pretty path they were
// generated for; when it matches the URL we landed on, the markup is already correct
// and we just wire up interactivity instead of re-fetching and re-rendering it
async function showInitialPage(): Promise<void> {
  const path = prettyLocationPath();
  const initialPage = path === '/' ? 'main' : path;
  const initialAnchor = location.hash ? location.hash.slice(1) : null;
  const content = document.getElementById('content')!;

  if (content.dataset.nwSsgPath === path) {
    // stand in for the replaceState replacePage() would have done, so back/forward and
    // in-app navigation see the same pretty URL + history shape as any other page load
    history.replaceState({ mdUrl: toMarkdownPath(initialPage), anchor: initialAnchor }, '', path + (location.hash || ''));
    hydrateExistingContent(content);
  } else {
    await replacePage(initialPage, initialAnchor);
  }

  if (initialAnchor) scrollToAnchor(initialAnchor);
}

// shows the boot error in place of the page so a failed start is visible
function showBootError(err: unknown): void {
  const content = document.getElementById('content')!;
  content.replaceChildren(makeElement('pre', '', `Boot error: ${err}`));
  content.classList.add('nw-loaded');
}

// slim bootstrap: initializes the wasm renderer and exposes the newweb host API without auth or config loading
export function startWASMEngineToPullMarkdown() {
  init(new URL('/engine/build/pkg/engine_bg.wasm', location.origin))
    .then(() => {
      window.newwebRender = wasmRender;
      installHostApi();

      return showInitialPage();
    })
    .catch(showBootError);
}
