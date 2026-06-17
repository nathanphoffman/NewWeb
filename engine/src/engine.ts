import init, { render as wasmRender } from '../build/pkg/engine.js';
import { handleWasm } from './wasm.js';
import { handleMore, handleNav, handleRedirect, navigateTo, replacePage, navigateWithData, renderNoData, looksLikeBareUrl, warnBareUrl } from './nav.js';
import { showToast, showModal, showFormModal, scrollToAnchor } from './ui.js';
import type { FieldDef } from './types.js';
import './theme.js';
import { showSettingsModal } from './settings.js';

const store = new Map<string, string>();
let allowedKeys = new Set<string>();

function updateViewDataBtn(): void {
  const menu = document.getElementById('nw-bar-menu')!;
  let btn = document.getElementById('nw-view-data') as HTMLButtonElement | null;
  if (store.size > 0) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'nw-view-data';
      btn.textContent = 'View Data';
      btn.addEventListener('click', showDataModal);
      const settings = document.getElementById('nw-settings')!;
      menu.insertBefore(btn, settings);
    }
  } else {
    btn?.remove();
  }
}

function dataModalMd(): string {
  const entries = [...store.entries()];
  const dataBlock = entries.length
    ? '```\n' + JSON.stringify(Object.fromEntries(entries), null, 2) + '\n```'
    : '_No data stored yet._';
  return `### Your Session Data\n\nThis data exists only for your current browser session — it is cleared when you leave or refresh the page. Sites use session data for logins, personalization, and data access.\n\n---\n\n${dataBlock}\n\n[Clear all data](nw:cleardata)`;
}

function showDataModal(): void {
  showModal(dataModalMd());
}

function buildInfoMd(desc: string, keys: string[]): string {
  const reasonSection = desc.trim()
    ? `### Why this script?\n${desc}`
    : `### ⚠ No description provided\nThe author of this page did not explain why this script needs to run.`;
  const dataSection = keys.length
    ? `\n\n### Data requested\nThis script will access: ${keys.map(k => `\`${k}\``).join(', ')}\n\nThese values will be read from your session.`
    : '';
  return reasonSection + dataSection + `\n\n[View your session data](nw:viewdata)`;
}

// gear info button — show script description and data declaration
document.addEventListener('click', (e: MouseEvent) => {
  const btn = (e.target as Element).closest('.nw-wasm-info') as HTMLElement | null;
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const desc = btn.dataset.desc ?? '';
  const keys = btn.dataset.keys ? btn.dataset.keys.split(',').filter(Boolean) : [];
  showModal(buildInfoMd(desc, keys));
});

// link interception — dispatch by protocol or treat bare paths as markdown
document.addEventListener('click', (e: MouseEvent) => {
  const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href) return;
  if (href.startsWith('#')) {
    e.preventDefault();
    const inner = href.slice(1);
    const basePart = inner.split('#')[0];
    if (basePart.includes('/') || basePart.endsWith('.md')) {
      navigateTo(inner);
    } else {
      const currentPage = location.hash.slice(1).split('#')[0] || 'main.md';
      history.replaceState({ mdUrl: currentPage, anchor: inner }, '', '#' + currentPage + '#' + inner);
      scrollToAnchor(inner);
    }
    return;
  }

  if (href === 'nw:viewdata') { e.preventDefault(); showDataModal(); return; }
  if (href === 'nw:cleardata') {
    e.preventDefault();
    store.clear();
    updateViewDataBtn();
    const body = document.querySelector('dialog .nw-modal-body');
    if (body) body.innerHTML = window.newwebRender!(dataModalMd());
    return;
  }

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
  if (href.startsWith('more:')) { e.preventDefault(); handleMore(a); return; }
  if (href.startsWith('custom://')) { e.preventDefault(); handleNav(a); return; }

  // external links with explicit scheme — let browser handle
  if (href.startsWith('http://') || href.startsWith('https://')) return;

  // bare path — warn on localhost if it looks like a URL missing https://
  e.preventDefault();
  if (window.location.hostname === 'localhost' && looksLikeBareUrl(href)) {
    warnBareUrl(href);
    return;
  }
  navigateTo(href);
});

// back/forward navigation
window.addEventListener('popstate', async (e: PopStateEvent) => {
  const state = e.state as { mdUrl?: string; anchor?: string | null } | null;
  const url = state?.mdUrl ?? 'main.md';
  await renderNoData(url);
  if (state?.anchor) scrollToAnchor(state.anchor);
});

// manual URL edits (typing in address bar, hitting Enter)
// Skip if history.state is set — that means popstate already handled it (back/forward),
// or we pushed this entry ourselves via pushState/replaceState.
window.addEventListener('hashchange', async () => {
  if (history.state) return;
  const hashVal = location.hash.slice(1) || 'main';
  const [page, anchor = null] = hashVal.split('#');
  await renderNoData(page || 'main.md');
  if (anchor) scrollToAnchor(anchor);
});

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
