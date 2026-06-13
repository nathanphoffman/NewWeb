import type { Modal } from './types.js';

export function closeModals(): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());
}

function parseWasmDirectives(a: HTMLAnchorElement): { desc: string; keys: string[] } {
  let node: Node | null = a.parentElement;
  let desc = '';
  const keys: string[] = [];
  while (node) {
    node = node.previousSibling;
    if (!node) break;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') continue;
    if (node.nodeType !== Node.COMMENT_NODE) break;
    const text = (node as Comment).data.trim();
    const reasonMatch = text.match(/^script_reasoning\s*:\s*([\s\S]*)/i);
    const dataMatch = text.match(/^data\s*:\s*([\s\S]*)/i);
    if (reasonMatch) desc = reasonMatch[1].trim();
    if (dataMatch) keys.push(...dataMatch[1].split(',').map(s => s.trim()).filter(Boolean));
  }
  return { desc, keys };
}

function annotateLinks(container: Element): void {
  container.querySelectorAll('a[href]').forEach(el => {
    const a = el as HTMLAnchorElement;
    const href = a.getAttribute('href')!;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      a.insertAdjacentHTML('beforeend', `<span class="nw-link-icon" aria-hidden="true">🌐</span>`);
    } else if (href.startsWith('wasm:')) {
      const { desc, keys } = parseWasmDirectives(a);
      a.dataset.desc = desc;
      a.dataset.keys = keys.join(',');
      a.insertAdjacentHTML('afterend',
        `<button class="nw-wasm-info" data-href="${href}" data-desc="${desc}" data-keys="${keys.join(',')}" aria-label="Script info">⚙</button>`
      );
    }
  });
}

export function renderPage(md: string): void {
  closeModals();
  const content = document.getElementById('content')!;
  content.innerHTML = window.newwebRender!(md);
  annotateLinks(content);
}

export function showToast(md: string, type: string): void {
  const el = document.createElement('div');
  el.className = `nw-toast nw-toast-${type}`;
  el.innerHTML = window.newwebRender ? window.newwebRender(md) : md;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export function showModal(md: string, closeLabel = 'Close'): Modal {
  closeModals();
  const dlg = document.createElement('dialog') as Modal;
  dlg.innerHTML = `<div class="nw-modal-body">${window.newwebRender ? window.newwebRender(md) : md}</div>
    <button class="nw-modal-close" autofocus>${closeLabel}</button>`;
  dlg.querySelector('.nw-modal-close')!.addEventListener('click', () => {
    if (dlg.onCancel) dlg.onCancel();
    dlg.remove();
  });
  document.body.appendChild(dlg);
  dlg.showModal();
  return dlg;
}

export function updateModal(m: Modal, md: string): void {
  const body = m.querySelector('.nw-modal-body');
  if (body) body.textContent = md;
}

export function showSpinner(): void {
  let s = document.getElementById('nw-spinner');
  if (!s) {
    s = document.createElement('div');
    s.id = 'nw-spinner';
    document.body.appendChild(s);
  }
  s.style.display = 'block';
}

export function hideSpinner(): void {
  const s = document.getElementById('nw-spinner');
  if (s) s.style.display = 'none';
}

export function showSuspendedBar(url: string): void {
  const bar = document.createElement('div');
  bar.id = 'nw-suspended';
  bar.innerHTML = `Redirect to <b>${url}</b> was cancelled.
    <button id="nw-continue">Continue</button>
    <button id="nw-dismiss">Dismiss</button>`;
  bar.querySelector('#nw-continue')!.addEventListener('click', () => { window.location.href = url; });
  bar.querySelector('#nw-dismiss')!.addEventListener('click', () => bar.remove());
  document.body.appendChild(bar);
}
