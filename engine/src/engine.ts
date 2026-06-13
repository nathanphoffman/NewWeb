import init, { render as wasmRender } from '../build/pkg/engine.js';
import { handleWasm } from './wasm.js';
import { handleMd, handleMore, handleNav, handleRedirect, fetchMd, navigateTo } from './nav.js';
import { showToast, showModal, renderPage } from './ui.js';
import './theme.js';

// link interception — dispatch by protocol
document.addEventListener('click', (e: MouseEvent) => {
  const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href) return;

  if (href.startsWith('wasm:'))     { e.preventDefault(); handleWasm(a); }
  if (href.startsWith('more:'))     { e.preventDefault(); handleMore(a); }
  if (href.startsWith('md:'))       { e.preventDefault(); handleMd(a); }
  if (href.startsWith('custom://')) { e.preventDefault(); handleNav(a); }
});

// back/forward navigation
window.addEventListener('popstate', async (e: PopStateEvent) => {
  const url = (e.state as { mdUrl?: string } | null)?.mdUrl ?? 'main.md';
  renderPage(await fetchMd(url));
});

// bootstrap: init WASM renderer, expose host API, load initial page
(async () => {
  await init(new URL('engine/build/pkg/engine_bg.wasm', location.href));
  window.newwebRender = wasmRender;

  window.newweb = {
    redirect: (url, reason) => handleRedirect(url, reason),
    info:     (md) => showToast(md, 'info'),
    error:    (md) => showToast(md, 'error'),
    more:     (md) => showModal(md),
  };

  const initial = location.hash ? location.hash.slice(1) : 'main.md';
  history.replaceState({ mdUrl: initial }, '', location.hash || '#main.md');
  renderPage(await fetchMd(initial));
})().catch(err => {
  document.getElementById('content')!.innerHTML = `<pre>Boot error: ${err}</pre>`;
});
