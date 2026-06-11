const GEMWEB_VERSION = "0.1.0";
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

  const { file, params } = parseWasmUrl(a.getAttribute('href'));
  const fields = parseFields(a.textContent);
  await loadAndExecute(file, { ...fields, ...params });

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

// wasm lifecycle
async function loadAndExecute(file, fields) {
  const bytes = await fetch(file).then(r => r.arrayBuffer());
  
  const imports = {
    gemweb: {
      fetch:    (url, data) => wasmFetch(url, data),
      info:     (md)        => showToast(md, 'info'),
      error:    (md)        => showToast(md, 'error'),
      redirect: (url, reason) => handleRedirect(url, reason),
      confirm:  (msg)       => showConfirm(msg),
      more:     (md)        => showModal(md),
    }
  };

  let module = await WebAssembly.instantiate(bytes, imports);
  await module.instance.exports.run(JSON.stringify(fields));
  module = null; // destroy
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

// redirect with countdown
function handleRedirect(url, reason) {
  let count = 3;
  const modal = showModal(`
### Redirecting to ${url}
${reason ? `Reason: ${reason}` : ''}

${count}...
  `);
  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      window.location = url;
    }
    updateModal(modal, `${count}...`);
  }, 1000);
  modal.onCancel = () => {
    clearInterval(interval);
    suspendPage(url);
  };
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
  el.innerHTML = window.gemwebRender ? window.gemwebRender(md) : md;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showModal(md) {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<div class="nw-modal-body">${window.gemwebRender ? window.gemwebRender(md) : md}</div>
    <button class="nw-modal-close" autofocus>Close</button>`;
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
  const html = window.gemwebRender(md);
  document.getElementById('content').innerHTML = html;
}

// theme picker
(function () {
  const sel = document.getElementById('nw-theme-select');
  const apply = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    sel.value = theme;
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
(async () => {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(fetch('engine.wasm'), go.importObject);
  go.run(result.instance);
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