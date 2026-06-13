import init, { render as wasmRender } from '../build/pkg/engine.js';
import { handleWasm } from './wasm.js';
import { handleMore, handleNav, handleRedirect, fetchMd, navigateTo, replacePage, navigateWithData, renderNoData, looksLikeBareUrl, warnBareUrl } from './nav.js';
import { showToast, showModal, renderPage, closeModals } from './ui.js';
import './theme.js';

const store = new Map<string, string>();
let allowedKeys = new Set<string>();

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
  if (!href || href.startsWith('#')) return;

  if (href === 'nw:viewdata')  { e.preventDefault(); showDataModal(); return; }
  if (href === 'nw:cleardata') {
    e.preventDefault();
    store.clear();
    const body = document.querySelector('dialog .nw-modal-body');
    if (body) body.innerHTML = window.newwebRender!(dataModalMd());
    return;
  }

  if (href.startsWith('wasm:')) {
    e.preventDefault();
    allowedKeys = new Set((a.dataset.keys ?? '').split(',').filter(Boolean));
    handleWasm(a).finally(() => { allowedKeys = new Set(); });
    return;
  }
  if (href.startsWith('more:'))     { e.preventDefault(); handleMore(a); return; }
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
  const url = (e.state as { mdUrl?: string } | null)?.mdUrl ?? 'main.md';
  await renderNoData(url);
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
    info:    (md) => showToast(md, 'info'),
    error:   (md) => showToast(md, 'error'),
    more:    (md) => showModal(md),
    load:    (url, data) => navigateWithData(url, data),
    store:   (key, value) => { store.set(key, value); },
    get:     (key) => allowedKeys.has(key) ? (store.get(key) ?? '') : '',
  };

  document.getElementById('nw-view-data')!.addEventListener('click', showDataModal);

  const initial = location.hash ? location.hash.slice(1) : 'main';
  await replacePage(initial);
})().catch(err => {
  document.getElementById('content')!.innerHTML = `<pre>Boot error: ${err}</pre>`;
});
