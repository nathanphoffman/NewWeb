const NEWWEB_VERSION = "0.1.0";
let authTokens = {};

// single entry point
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href) return;

  if (href.startsWith('wasm:'))     { e.preventDefault(); handleWasm(a); }
  if (href.startsWith('more:'))     { e.preventDefault(); handleMore(a); }
  if (href.startsWith('md:'))       { e.preventDefault(); handleMd(a); }
  if (href.startsWith('custom://')) { e.preventDefault(); handleNav(a); }
});

// protocol handlers
async function handleWasm(a) {
  if (a.dataset.pending) return; // debounce
  a.dataset.pending = true;
  showSpinner();

  const { file } = parseWasmUrl(a.getAttribute('href'));
  await loadAndExecute(file);

  delete a.dataset.pending;
  hideSpinner();
}

async function handleMore(a) {
  const url = a.getAttribute('href').replace('more:', '');
  const md = await fetchMd(url);
  showModal(md);
}

async function handleMd(a) {
  await navigateTo(a.getAttribute('href').replace('md:', ''));
}

async function handleNav(a) {
  await navigateTo(a.getAttribute('href'));
}

async function navigateTo(url) {
  const md = await fetchMd(url);
  history.pushState({ mdUrl: url }, '', '#' + url);
  renderPage(md);
}

// wasm lifecycle — dev modules use TinyGo runtime, lazy-loaded on first use
let GoTiny = null;
async function loadTinyRuntime() {
  if (GoTiny) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'engine/wasm_exec_tiny.js';
    s.onload = () => { GoTiny = Go; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadAndExecute(file) {
  await loadTinyRuntime();
  const bytes = await fetch(file).then(r => r.arrayBuffer());
  const go = new GoTiny();
  const module = await WebAssembly.instantiate(bytes, go.importObject);
  await go.run(module.instance);
}

// network -- same origin enforced
async function wasmFetch(url, data) {
  const requestDomain = new URL(url).hostname;
  const pageDomain = window.location.hostname;
  if (requestDomain !== pageDomain) {
    showToast('Cross-domain fetch prohibited', 'error');
    return null;
  }
  const domain = window.location.hostname;
  const token = authTokens[domain];
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }).then(r => r.text());
}

// redirect — immediate for md: and same-origin, countdown only for cross-domain
function handleRedirect(url, reason) {
  if (url.startsWith('md:')) {
    navigateTo(url.slice(3));
    return;
  }

  let crossDomain = false;
  try {
    crossDomain = new URL(url).hostname !== window.location.hostname;
  } catch (_) { /* relative url — same origin */ }

  if (!crossDomain) {
    window.location = url;
    return;
  }

  let count = 3;
  const dlg = showModal(
    `### Leaving site\n${reason ? `_${reason}_\n\n` : ''}` +
    `Navigating to \`${url}\` in <span id="nw-countdown">${count}</span>s…`,
    'Cancel Redirect'
  );
  const countEl = () => dlg.querySelector('#nw-countdown');
  const interval = setInterval(() => {
    count--;
    if (countEl()) countEl().textContent = count;
    if (count === 0) {
      clearInterval(interval);
      dlg.remove();
      window.location = url;
    }
  }, 1000);
  dlg.onCancel = () => { clearInterval(interval); suspendPage(url); };
}

// suspended state after cancelled redirect
function suspendPage(url) {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(a => a.dataset.suspended = true);
  showSuspendedBar(url);
}

// ui primitives
function showToast(md, type) {
  const el = document.createElement('div');
  el.className = `nw-toast nw-toast-${type}`;
  el.innerHTML = window.newwebRender ? window.newwebRender(md) : md;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showModal(md, closeLabel = 'Close') {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<div class="nw-modal-body">${window.newwebRender ? window.newwebRender(md) : md}</div>
    <button class="nw-modal-close" autofocus>${closeLabel}</button>`;
  dlg.querySelector('.nw-modal-close').onclick = () => {
    if (dlg.onCancel) dlg.onCancel();
    dlg.remove();
  };
  document.body.appendChild(dlg);
  dlg.showModal();
  return dlg;
}

function updateModal(m, md) {
  const body = m.querySelector('.nw-modal-body');
  if (body) body.textContent = md;
}

function showSpinner() {
  let s = document.getElementById('nw-spinner');
  if (!s) {
    s = document.createElement('div');
    s.id = 'nw-spinner';
    document.body.appendChild(s);
  }
  s.style.display = 'block';
}

function hideSpinner() {
  const s = document.getElementById('nw-spinner');
  if (s) s.style.display = 'none';
}

function showSuspendedBar(url) {
  const bar = document.createElement('div');
  bar.id = 'nw-suspended';
  bar.innerHTML = `Redirect to <b>${url}</b> was cancelled.
    <button id="nw-continue">Continue</button>
    <button id="nw-dismiss">Dismiss</button>`;
  bar.querySelector('#nw-continue').onclick = () => { window.location = url; };
  bar.querySelector('#nw-dismiss').onclick = () => bar.remove();
  document.body.appendChild(bar);
}

function renderPage(md) {
  const html = window.newwebRender(md);
  document.getElementById('content').innerHTML = html;
}

// animation toggle
(function () {
  const btn = document.getElementById('nw-anim-toggle');
  const apply = paused => {
    document.documentElement.classList.toggle('nw-paused', paused);
    btn.textContent = paused ? 'Resume Animations' : 'Stop Animations';
  };
  apply(localStorage.getItem('nw-paused') === 'true');
  btn.addEventListener('click', () => {
    const paused = !document.documentElement.classList.contains('nw-paused');
    apply(paused);
    localStorage.setItem('nw-paused', paused);
  });
})();

// theme picker
(function () {
  const sel = document.getElementById('nw-theme-select');

  const CAT_DEFS = [
    { x: '6%',  y: '22%', size: 64, dur: 4.0, delay: 0    },
    { x: '83%', y: '14%', size: 48, dur: 6.2, delay: -2.1 },
    { x: '13%', y: '70%', size: 56, dur: 5.1, delay: -1.3 },
    { x: '77%', y: '66%', size: 52, dur: 7.8, delay: -3.5 },
    { x: '46%', y: '80%', size: 44, dur: 3.4, delay: -0.7 },
    { x: '90%', y: '44%', size: 60, dur: 8.3, delay: -4.1 },
    { x: '2%',  y: '48%', size: 46, dur: 4.7, delay: -1.8 },
    { x: '60%', y: '30%', size: 50, dur: 5.9, delay: -2.9 },
  ];

  function addCats() {
    removeCats();
    CAT_DEFS.forEach(d => {
      const img = document.createElement('img');
      img.src = 'engine/cat.svg';
      img.className = 'nw-spinning-cat';
      img.style.cssText = `left:${d.x};top:${d.y};width:${d.size}px;height:${d.size}px;` +
        `animation-duration:${d.dur}s;animation-delay:${d.delay}s`;
      document.body.appendChild(img);
    });
  }

  function removeCats() {
    document.querySelectorAll('.nw-spinning-cat').forEach(el => el.remove());
  }

  const apply = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    sel.value = theme;
    if (theme === 'cats') addCats(); else removeCats();
  };
  const saved = localStorage.getItem('nw-theme');
  if (saved) apply(saved);
  sel.addEventListener('change', e => {
    apply(e.target.value);
    localStorage.setItem('nw-theme', e.target.value);
  });
})();

// back/forward navigation
window.addEventListener('popstate', async e => {
  const url = e.state?.mdUrl ?? 'main.md';
  const md = await fetchMd(url);
  renderPage(md);
});

// WASM bootstrap + initial page load
import init, { render as wasmRender } from './pkg/engine.js';
(async () => {
  await init();
  window.newwebRender = wasmRender;

  // expose host API for dev Go WASM modules (accessed via syscall/js)
  window.newweb = {
    redirect: (url, reason) => handleRedirect(url, reason),
    info:     (md)          => showToast(md, 'info'),
    error:    (md)          => showToast(md, 'error'),
    more:     (md)          => showModal(md),
  };

  const initial = location.hash ? location.hash.slice(1) : 'main.md';
  history.replaceState({ mdUrl: initial }, '', location.hash || '#main.md');
  const md = await fetchMd(initial);
  renderPage(md);
})().catch(err => {
  document.getElementById('content').innerHTML = `<pre>Boot error: ${err}</pre>`;
});

// parsing utilities
function parseWasmUrl(href) {
  const withoutProtocol = href.replace('wasm:', '');
  const [file, qs] = withoutProtocol.split('?');
  const params = {};
  if (qs) qs.split('&').forEach(p => {
    const [k, v] = p.split('=');
    params[k] = v;
  });
  return { file, params };
}

function parseFields(text) {
  const parts = text.split(',').map(s => s.trim());
  parts.pop(); // remove label
  return parts.reduce((acc, f) => {
    const name = f.replace(/[*_+]/g, '').trim();
    const type = f.endsWith('*') ? 'password'
               : f.endsWith('_') ? 'select-one'
               : f.endsWith('+') ? 'select-many'
               : 'text';
    acc[name] = { type, value: null };
    return acc;
  }, {});
}

function fetchMd(url) {
  return fetch(url).then(r => r.text());
}