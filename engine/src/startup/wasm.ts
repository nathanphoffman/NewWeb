import { handleRedirect, navigateTo, navigateWithData, replacePage } from "../nav";
import { FieldDef } from "../types";
import { scrollToAnchor, showFormModal, showModal, showSpinner, hideSpinner, showToast } from "../ui";
import { handleWasm, loadAndExecute } from "../wasm";
import { showDataModal, store } from "./engineCode";
import { updateViewDataBtn, updateAuthButtons, setLoggedIn, getIsLoggedIn } from "./markdownUpdates";
import init, { render as wasmRender } from '../../build/pkg/engine.js';
import { showSettingsModal } from "../settings";

declare global {
  const nwEditor: {
    showEditModal(filename: string, initialContent: string, onSave: (content: string) => void): void;
    showAddModal(onSave: (filepath: string, content: string) => void): void;
  };
}

let allowedKeys = new Set<string>();
let apiFetchPending = false;

// Keys written by the engine itself — never exposed to user-loaded WASM modules
const PROTECTED_KEYS = new Set(['new_web_username', 'new_web_password_hash']);

// clears stored credentials and updates the menu to remove auth buttons
function logout(): void {
  store.delete('new_web_username');
  store.delete('new_web_password_hash');
  localStorage.removeItem('new_web_username');
  localStorage.removeItem('new_web_password_hash');
  setLoggedIn(false);
  updateAuthButtons(openEditModal, openAddModal, logout);
}

// fetches newweb.config.json and flattens its values into the session store under the "config." prefix
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

// shows the login form modal and, on submit, loads auth.wasm with the credentials scoped in allowedKeys
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

// this is for non-slim editor mode
// fetches the current page's markdown and opens the editor modal; on save runs cms.wasm to persist the change
async function openEditModal(): Promise<void> {
  const mdUrl = (history.state as { mdUrl?: string } | null)?.mdUrl;
  if (!mdUrl) { showToast('No page loaded', 'error'); return; }
  let content: string;
  try {
    content = await fetch(mdUrl).then(r => r.text());
  } catch {
    showToast('Failed to load page content', 'error');
    return;
  }
  nwEditor.showEditModal(mdUrl, content, async (savedContent) => {
    store.set('cms.action', 'edit');
    store.set('cms.filepath', mdUrl);
    store.set('cms.content', savedContent);
    allowedKeys = new Set(['cms.action', 'cms.filepath', 'cms.content']);
    apiFetchPending = false;
    showSpinner();
    try {
      await loadAndExecute('src/cms.wasm');
    } catch {
      showToast('CMS module failed to load', 'error');
      hideSpinner();
    } finally {
      store.delete('cms.action');
      store.delete('cms.filepath');
      store.delete('cms.content');
      allowedKeys = new Set();
      if (!apiFetchPending) hideSpinner();
    }
  });
}

// this is for non-slim editor mode
// opens the "add new page" editor modal; on save runs cms.wasm to create the file
function openAddModal(): void {
  nwEditor.showAddModal(async (filepath, content) => {
    store.set('cms.action', 'create');
    store.set('cms.filepath', filepath);
    store.set('cms.content', content);
    allowedKeys = new Set(['cms.action', 'cms.filepath', 'cms.content']);
    apiFetchPending = false;
    showSpinner();
    try {
      await loadAndExecute('src/cms.wasm');
    } catch {
      showToast('CMS module failed to load', 'error');
      hideSpinner();
    } finally {
      store.delete('cms.action');
      store.delete('cms.filepath');
      store.delete('cms.content');
      allowedKeys = new Set();
      if (!apiFetchPending) hideSpinner();
    }
  });
}

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

// bootstraps the engine: loads config, initializes the wasm markdown renderer, exposes the newweb host API, and loads the initial page
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
      get: (key) => {
        if (PROTECTED_KEYS.has(key)) return '';
        return allowedKeys.has(key) ? (store.get(key) ?? '') : '';
      },
      auth: async (success, H, username) => {
        const timeToken = store.get('auth.time_token') ?? '';
        store.delete('auth.username');
        store.delete('auth.password');
        store.delete('auth.time_token');
        allowedKeys = new Set();
        if (!success) {
          hideSpinner();
          showToast('Login failed', 'error');
          return;
        }
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, token: timeToken }),
          });
          if (res.ok) {
            store.set('new_web_username', username);
            store.set('new_web_password_hash', H);
            localStorage.setItem('new_web_username', username);
            localStorage.setItem('new_web_password_hash', H);
            updateViewDataBtn();
            setLoggedIn(true);
            updateAuthButtons(openEditModal, openAddModal, logout);
            showToast('Login successful', 'info');
          } else {
            showToast('Login failed', 'error');
          }
        } catch {
          showToast('Auth server error', 'error');
        } finally {
          hideSpinner();
        }
      },
      apiFetch: async (method, url, body) => {
        apiFetchPending = true;
        const H        = localStorage.getItem('new_web_password_hash') ?? '';
        const username = localStorage.getItem('new_web_username') ?? '';
        if (!H || !username) {
          apiFetchPending = false;
          hideSpinner();
          showToast('Not logged in', 'error');
          return;
        }
        try {
          const minute = Math.floor(Date.now() / 60000).toString();
          const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(H + minute));
          const token = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
          const res = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-NW-Username': username,
            },
            body: body || undefined,
          });
          let json: { message?: string; error?: string } = {};
          try { json = await res.json(); } catch { /* non-JSON response */ }
          if (res.ok) {
            showToast(json.message ?? 'Saved', 'info');
          } else {
            showToast(json.error ?? 'Request failed', 'error');
          }
        } catch {
          showToast('Network error', 'error');
        } finally {
          apiFetchPending = false;
          hideSpinner();
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

    // Restore persisted login session
    const storedUsername = localStorage.getItem('new_web_username');
    const storedToken    = localStorage.getItem('new_web_password_hash');
    if (storedUsername && storedToken) {
      store.set('new_web_username', storedUsername);
      store.set('new_web_password_hash', storedToken);
      updateViewDataBtn();
      setLoggedIn(true);
      updateAuthButtons(openEditModal, openAddModal, logout);
    }

    const hashVal = location.hash ? location.hash.slice(1) : 'main';
    const [initialPage, initialAnchor = null] = hashVal.split('#') as [string, string?];
    await replacePage(initialPage, initialAnchor ?? null);
    if (initialAnchor) scrollToAnchor(initialAnchor);
  })().catch(err => {
    document.getElementById('content')!.innerHTML = `<pre>Boot error: ${err}</pre>`;
  });
}

