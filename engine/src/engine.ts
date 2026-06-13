import init, { render as wasmRender } from '../build/pkg/engine.js';
import { handleWasm } from './wasm.js';
import { handleMore, handleNav, handleRedirect, fetchMd, navigateTo, looksLikeBareUrl, warnBareUrl } from './nav.js';
import { showToast, showModal, renderPage } from './ui.js';
import './theme.js';

// link interception — dispatch by protocol or treat bare paths as markdown
document.addEventListener('click', (e: MouseEvent) => {
  const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#')) return;

  if (href.startsWith('wasm:'))     { e.preventDefault(); handleWasm(a); return; }
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
  renderPage(await fetchMd(url));
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
