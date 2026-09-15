import { handleRedirect, navigateTo, navigateWithData, replacePage } from "../nav";
import { FieldDef } from "../types";
import { hydrateExistingContent, scrollToAnchor } from "../ui/page";
import { toRootRelative } from "../utility";
import { showFormModal, showModal } from "../ui/modals";
import { showSpinner, hideSpinner } from "../ui/spinner";
import { showToast } from "../ui/toast";
import { handleWasm } from "../wasm";
import { showDataModal, store } from "./engineCode";
import { updateViewDataBtn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';
import { showSettingsModal } from "../settings";

let allowedKeys = new Set<string>();

// intercepts wasm: link clicks — shows a form if fields are declared, then executes the wasm with scoped key access
export function handleWASMClick(e: MouseEvent, a: HTMLAnchorElement, href: string) {
  if (href.startsWith('wasm:')) {
    e.preventDefault();
    const fieldsJson = a.dataset.fields;
    if (fieldsJson) {
      const fieldSections = JSON.parse(fieldsJson) as FieldDef[][];
      const linkText = a.textContent?.trim() ?? 'Submit';
      showFormModal(linkText, fieldSections, values => {
        const formKeys = Object.keys(values);
        for (const [k, v] of Object.entries(values)) store.set(k, v);
        allowedKeys = new Set([
          ...(a.dataset.keys ?? '').split(',').filter(Boolean),
          ...formKeys,
        ]);
        handleWasm(a).finally(() => {
          for (const k of formKeys) store.delete(k);
          allowedKeys = new Set();
          updateViewDataBtn();
        });
      });
    } else {
      allowedKeys = new Set((a.dataset.keys ?? '').split(',').filter(Boolean));
      handleWasm(a).finally(() => { allowedKeys = new Set(); });
    }
    return;
  }
}

// slim bootstrap: initializes the wasm renderer and exposes the newweb host API without auth or config loading
export function startWASMEngineToPullMarkdown() {
  (async () => {
    await init(new URL('/engine/build/pkg/engine_bg.wasm', location.origin));
    window.newwebRender = wasmRender;

    window.newweb = {
      redirect: (url, reason) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          handleRedirect(url, reason);
        } else {
          navigateTo(url);
        }
      },
      replace: (url) => replacePage(url),
      info:    (md) => showToast(md, 'info'),
      error:   (md) => showToast(md, 'error'),
      more:    (md) => showModal(md),
      load:    (url, data) => navigateWithData(url, data),
      store:   (key, value) => { store.set(key, value); updateViewDataBtn(); },
      get:     (key) => allowedKeys.has(key) ? (store.get(key) ?? '') : '',
    };

    // build-static.js writes real ".html" files (e.g. "about.html", "blog/post.html") so the
    // output works on static hosts with no pretty-URL rewriting; normalize a raw file path
    // back to the pretty form so it matches how the SPA's own links/history always look
    const path = location.pathname === '/index.html' ? '/'
      : location.pathname.endsWith('.html') ? location.pathname.slice(0, -'.html'.length)
      : location.pathname;
    const initialPage = path === '/' ? 'main' : path;
    const initialAnchor = location.hash ? location.hash.slice(1) : null;

    // build-static.js stamps statically pre-rendered pages with the pretty path they were
    // generated for; when it matches the URL we landed on, the markup is already correct
    // and we just wire up interactivity instead of re-fetching and re-rendering it
    const content = document.getElementById('content')!;
    if (content.dataset.nwSsgPath === path) {
      // stand in for the replaceState replacePage() would have done, so back/forward and
      // in-app navigation see the same pretty URL + history shape as any other page load
      const mdUrl = toRootRelative(initialPage.endsWith('.md') ? initialPage : `${initialPage}.md`);
      history.replaceState({ mdUrl, anchor: initialAnchor }, '', path + (location.hash || ''));
      hydrateExistingContent(content);
      if (initialAnchor) scrollToAnchor(initialAnchor);
    } else {
      await replacePage(initialPage, initialAnchor);
      if (initialAnchor) scrollToAnchor(initialAnchor);
    }
  })().catch(err => {
    const content = document.getElementById('content')!;
    content.innerHTML = `<pre>Boot error: ${err}</pre>`;
    content.classList.add('nw-loaded');
  });
}