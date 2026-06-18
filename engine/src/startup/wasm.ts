import { handleRedirect, navigateTo, navigateWithData, replacePage } from "../nav";
import { FieldDef } from "../types";
import { scrollToAnchor, showFormModal, showModal, showSpinner, hideSpinner, showToast } from "../ui";
import { handleWasm, loadAndExecute } from "../wasm";
import { showDataModal, store } from "./engineCode";
import { updateViewDataBtn, updateAuthButtons, setLoggedIn, getIsLoggedIn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';
import { showSettingsModal } from "../settings";

let allowedKeys = new Set<string>();

async function loadConfig(): Promise<void> {
  try {
    const cfg = await fetch('newweb.config.json').then(r => r.json()) as Record<string, unknown>;
    function flatten(obj: Record<string, unknown>, prefix: string): void {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          flatten(v as Record<string, unknown>, key);
        } else {
          store.set(`config.${key}`, String(v ?? ''));
        }
      }
    }
    flatten(cfg, '');
  } catch { /* config file is optional */ }
}

function openLoginForm(): void {
  const fieldSections: FieldDef[][] = [[
    { key: 'auth.username', label: 'Username', type: 'text',     maxlength: 64,  options: null },
    { key: 'auth.password', label: 'Password', type: 'password', maxlength: 128, options: null },
  ]];
  showFormModal('Login', fieldSections, async (values) => {
    for (const [k, v] of Object.entries(values)) store.set(k, v);
    allowedKeys = new Set(['auth.username', 'auth.password', 'config.auth.endpoint', 'config.auth.hashMethod']);
    showSpinner();
    try {
      await loadAndExecute('src/auth.wasm');
      // hideSpinner and store cleanup handled by newweb.auth() callback
    } catch {
      hideSpinner();
      store.delete('auth.username');
      store.delete('auth.password');
      allowedKeys = new Set();
      showToast('Auth module failed to load', 'error');
    }
  });
}

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
    await loadConfig();
    // !! this should be updated to just engine.wasm
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
      auth: (success) => {
        hideSpinner();
        store.delete('auth.username');
        store.delete('auth.password');
        allowedKeys = new Set();
        if (success) {
          setLoggedIn(true);
          updateAuthButtons();
          showToast('Login successful', 'info');
        } else {
          showToast('Login failed', 'error');
        }
      },
    };

    document.getElementById('nw-home')!.addEventListener('click', () => {
      const barMenu = document.getElementById('nw-bar-menu');
      const hamburger = document.getElementById('nw-hamburger');
      barMenu?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      navigateTo('main');
    });
    document.getElementById('nw-settings')!.addEventListener('click', () =>
      showSettingsModal(
        () => [...store.entries()],
        showDataModal,
        openLoginForm,
        getIsLoggedIn()
      )
    );

    const hashVal = location.hash ? location.hash.slice(1) : 'main';
    const [initialPage, initialAnchor = null] = hashVal.split('#') as [string, string?];
    await replacePage(initialPage, initialAnchor ?? null);
    if (initialAnchor) scrollToAnchor(initialAnchor);
  })().catch(err => {
    document.getElementById('content')!.innerHTML = `<pre>Boot error: ${err}</pre>`;
  });
}

