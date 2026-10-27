import { CONTENT_ID, ERROR_TOAST_TYPE, HTTPS_PREFIX, HTTP_PREFIX, LOADED_CLASS, WASM_PREFIX } from '../shared/constants';
import { makeElement } from "../ui/dom";
import { navigateTo, navigateWithData } from "../navigation/nav";
import { replacePage } from "../navigation/navLinks";
import { handleRedirect } from "../navigation/redirect";
import { hydrateExistingContent, scrollToAnchor } from "../ui/page";
import { toMarkdownPath } from "../navigation/navPaths";
import { showMarkdownModal } from "../ui/overlays/modals";
import { showToast } from "../ui/overlays/toast";
import { isKeyAllowed } from "./wasmClicks";
import { store } from "./engineCode";
import { updateViewDataBtn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';

// sends http(s) urls through the redirect countdown and everything else through in-app navigation
function redirectOrNavigate(address: string, reason?: string): void {
  if (address.startsWith(HTTP_PREFIX) || address.startsWith(HTTPS_PREFIX)) handleRedirect(address, reason);
  else navigateTo(address);
}

// exposes the host API that wasm modules call on window.newweb
function installHostApi(): void {
  window.newweb = {
    redirect: redirectOrNavigate,
    replace: (address) => replacePage(address),
    info:    (markdown) => showToast(markdown, 'info'),
    error:   (markdown) => showToast(markdown, ERROR_TOAST_TYPE),
    more:    (markdown) => showMarkdownModal(markdown),
    load:    (address, data) => navigateWithData(address, data),
    store:   (entryKey, value) => { store.set(entryKey, value); updateViewDataBtn(); },
    get:     (entryKey) => isKeyAllowed(entryKey) ? (store.get(entryKey) ?? '') : '',
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
  const content = document.getElementById(CONTENT_ID)!;

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
function showBootError(error: unknown): void {
  const content = document.getElementById(CONTENT_ID)!;
  content.replaceChildren(makeElement('pre', '', `Boot error: ${error}`));
  content.classList.add(LOADED_CLASS);
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
