import { handleRedirect, navigateTo, navigateWithData, replacePage } from "../nav";
import { FieldDef } from "../types";
import { scrollToAnchor, showFormModal, showModal, showToast } from "../ui";
import { handleWasm } from "../wasm";
import { showDataModal, store } from "./engineCode";
import { updateViewDataBtn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';
import { showSettingsModal } from "../settings";

let allowedKeys = new Set<string>();

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

export function startWASMEngineToPullMarkdown() {
  // bootstrap: init WASM renderer, expose host API, load initial page
  (async () => {
    await init(new URL('engine/build/pkg/engine_bg.wasm', location.href));
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
      info: (md) => showToast(md, 'info'),
      error: (md) => showToast(md, 'error'),
      more: (md) => showModal(md),
      load: (url, data) => navigateWithData(url, data),
      store: (key, value) => { store.set(key, value); updateViewDataBtn(); },
      get: (key) => allowedKeys.has(key) ? (store.get(key) ?? '') : '',
    };

    document.getElementById('nw-home')!.addEventListener('click', () => navigateTo('main'));
    document.getElementById('nw-settings')!.addEventListener('click', () =>
      showSettingsModal(() => [...store.entries()], showDataModal)
    );

    const hashVal = location.hash ? location.hash.slice(1) : 'main';
    const [initialPage, initialAnchor = null] = hashVal.split('#') as [string, string?];
    await replacePage(initialPage, initialAnchor ?? null);
    if (initialAnchor) scrollToAnchor(initialAnchor);
  })().catch(err => {
    document.getElementById('content')!.innerHTML = `<pre>Boot error: ${err}</pre>`;
  });
}

