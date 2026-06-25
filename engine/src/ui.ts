import type { FieldDef, Modal } from './types.js';
import { getMaxImageKb } from './settings.js';
import { highlightBlock } from './highlight.js';

const KNOWN_TYPES = new Set(['text', 'email', 'password', 'number', 'tel', 'date', 'textarea']);

// converts a camelCase field name to a human-readable Title Case label
function camelToLabel(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

// parses a comma-separated field definition string (e.g. "name, age:number:3, role:admin|user") into FieldDef objects
function parseFields(text: string): FieldDef[] {
  return text.split(',').map(s => s.trim()).filter(Boolean).map(def => {
    const colonIdx = def.indexOf(':');
    if (colonIdx === -1) {
      return { key: `form.${def}`, label: camelToLabel(def), type: 'text', maxlength: null, options: null };
    }
    const name = def.slice(0, colonIdx).trim();
    const rest = def.slice(colonIdx + 1).trim();
    const key = `form.${name}`;
    const label = camelToLabel(name);
    if (rest.includes('|')) {
      return { key, label, type: 'select', maxlength: null, options: rest.split('|').map(o => o.trim()) };
    }
    const sepIdx = rest.indexOf(':');
    const typePart = sepIdx === -1 ? rest : rest.slice(0, sepIdx);
    const limitStr = sepIdx === -1 ? '' : rest.slice(sepIdx + 1);
    if (KNOWN_TYPES.has(typePart)) {
      const parsed = limitStr ? parseInt(limitStr, 10) : null;
      const maxlength = parsed !== null && !isNaN(parsed) ? parsed : null;
      return { key, label, type: typePart, maxlength, options: null };
    }
    return { key, label, type: 'text', maxlength: null, options: null };
  });
}

// removes all open <dialog> elements from the DOM
export function closeModals(): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());
}

// walks the preceding sibling HTML comments of a wasm link to extract script_reasoning, data keys, and field definitions
function parseWasmDirectives(a: HTMLAnchorElement): { desc: string; keys: string[]; fieldSections: FieldDef[][] } {
  let node: Node | null = a.parentElement;
  let desc = '';
  const keys: string[] = [];
  const fieldSections: FieldDef[][] = [];
  while (node) {
    node = node.previousSibling;
    if (!node) break;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') continue;
    if (node.nodeType !== Node.COMMENT_NODE) break;
    const text = (node as Comment).data.trim();
    const reasonMatch = text.match(/^script_reasoning\s*:\s*([\s\S]*)/i);
    const dataMatch   = text.match(/^data\s*:\s*([\s\S]*)/i);
    const fieldsMatch = text.match(/^fields\s*:\s*([\s\S]*)/i);
    if (reasonMatch) desc = reasonMatch[1].trim();
    if (dataMatch)   keys.push(...dataMatch[1].split(',').map(s => s.trim()).filter(Boolean));
    if (fieldsMatch) fieldSections.unshift(parseFields(fieldsMatch[1].trim()));
  }
  return { desc, keys, fieldSections };
}

// HEAD-checks an image URL and returns true if it fits within the configured max size
async function checkSize(src: string): Promise<boolean> {
  if (src.startsWith('data:')) return true;
  try {
    const res = await fetch(src, { method: 'HEAD' });
    const cl = res.headers.get('content-length');
    if (cl === null) return true;
    return parseInt(cl, 10) <= getMaxImageKb() * 1024;
  } catch {
    return true;
  }
}

// opens an image in a fullscreen lightbox dialog
function showLightbox(src: string, alt: string): void {
  const dlg = document.createElement('dialog');
  dlg.className = 'nw-lightbox';
  const close = document.createElement('button');
  close.className = 'nw-lightbox__close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  dlg.appendChild(close);
  dlg.appendChild(img);
  if (alt) {
    const cap = document.createElement('figcaption');
    cap.className = 'nw-lightbox__caption';
    cap.textContent = alt;
    dlg.appendChild(cap);
  }
  dlg.addEventListener('click', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}

// wraps an image in a <figure> with optional caption; clicking opens the lightbox
function buildFrame(src: string, alt: string): HTMLElement {
  const fig = document.createElement('figure');
  fig.className = 'nw-image-frame';
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = 'nw-image-frame__img';
  fig.appendChild(img);
  if (alt) {
    const cap = document.createElement('figcaption');
    cap.className = 'nw-image-frame__caption';
    cap.textContent = alt;
    fig.appendChild(cap);
  }
  fig.addEventListener('click', () => showLightbox(src, alt));
  return fig;
}

// creates a button that loads an oversized image on demand instead of auto-loading it
function buildFallback(src: string, alt: string): HTMLElement {
  const btn = document.createElement('button');
  const text = "Image size is beyond set limit, click to load it anyway.";


  btn.className = 'nw-img-load-btn';
  btn.textContent = alt ? `${alt} — ${text}` : text;
  btn.addEventListener('click', () => btn.replaceWith(buildFrame(src, alt)));
  return btn;
}

// replaces nw-img-placeholder spans with framed images or fallback buttons based on size
async function processImages(container: Element): Promise<void> {
  const placeholders = Array.from(
    container.querySelectorAll<HTMLElement>('span.nw-img-placeholder')
  );
  await Promise.all(placeholders.map(async span => {
    const src = span.dataset.src ?? '';
    const alt = span.dataset.alt ?? '';
    const allowed = await checkSize(src);
    span.replaceWith(allowed ? buildFrame(src, alt) : buildFallback(src, alt));
  }));
}

// adds a globe icon to external links and a gear info button next to wasm: links
function annotateLinks(container: Element): void {
  container.querySelectorAll('a[href]').forEach(el => {
    const a = el as HTMLAnchorElement;
    const href = a.getAttribute('href')!;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      a.insertAdjacentHTML('beforeend', `<span class="nw-link-icon" aria-hidden="true">🌐</span>`);
    } else if (href.startsWith('wasm:')) {
      const { desc, keys, fieldSections } = parseWasmDirectives(a);
      a.dataset.desc = desc;
      a.dataset.keys = keys.join(',');
      if (fieldSections.length) a.dataset.fields = JSON.stringify(fieldSections);
      a.insertAdjacentHTML('afterend',
        `<button class="nw-wasm-info" data-href="${href}" data-desc="${desc}" data-keys="${keys.join(',')}" aria-label="Script info">⚙</button>`
      );
    }
  });
}

// converts heading text to a lowercase URL-safe id slug
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

// assigns slugified id attributes to headings that don't already have one, de-duplicating with a counter
function addHeadingIds(container: Element): void {
  const seen = new Map<string, number>();
  container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6').forEach(h => {
    if (h.id) return;
    const base = slugify(h.textContent ?? '');
    if (!base) return;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    h.id = n === 0 ? base : `${base}-${n}`;
  });
}

// smoothly scrolls to the element with the given id
export function scrollToAnchor(id: string): void {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// renders markdown into #content, replacing <img> tags with placeholders, then runs heading ids, link annotation, syntax highlighting, and image loading
export function renderPage(md: string): void {
  closeModals();
  window.scrollTo(0, 0);
  const content = document.getElementById('content')!;
  const html = window.newwebRender!(md).replace(
    /<img\b([^>]*)>/gi,
    (_, attrs) => {
      const src = (attrs.match(/src="([^"]*)"/) ?? [])[1] ?? '';
      const alt = (attrs.match(/alt="([^"]*)"/) ?? [])[1] ?? '';
      return `<span class="nw-img-placeholder" data-src="${src}" data-alt="${alt}"></span>`;
    }
  );
  content.innerHTML = html;
  addHeadingIds(content);
  annotateLinks(content);
  highlightBlock(content);
  void processImages(content);
  document.dispatchEvent(new CustomEvent('nw-page-rendered'));
}

// shows a self-dismissing toast notification rendered from markdown
export function showToast(md: string, type: string): void {
  const el = document.createElement('div');
  el.className = `nw-toast nw-toast-${type}`;
  el.innerHTML = window.newwebRender ? window.newwebRender(md) : md;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// opens a <dialog> modal with rendered markdown content and a close button
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
  highlightBlock(dlg);
  dlg.showModal();
  return dlg;
}

// builds and opens a form dialog for collecting user input before running a wasm script
export function showFormModal(
  linkText: string,
  fieldSections: FieldDef[][],
  onSubmit: (values: Record<string, string>) => void
): void {
  closeModals();
  const dlg = document.createElement('dialog');
  dlg.className = 'nw-form-modal';

  const title = document.createElement('h3');
  title.className = 'nw-form-title';
  title.textContent = `Input Required for '${linkText}'`;
  dlg.appendChild(title);

  const form = document.createElement('form');
  form.noValidate = false;

  for (const section of fieldSections) {
    const sec = document.createElement('div');
    sec.className = 'nw-form-section';
    for (const field of section) {
      const wrap = document.createElement('div');
      wrap.className = 'nw-form-field';

      const lbl = document.createElement('label');
      lbl.htmlFor = field.key;
      lbl.textContent = field.label;
      wrap.appendChild(lbl);

      if (field.type === 'select') {
        const sel = document.createElement('select');
        sel.id = field.key;
        sel.name = field.key;
        sel.required = true;
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = `Choose ${field.label}…`;
        blank.disabled = true;
        blank.selected = true;
        sel.appendChild(blank);
        for (const opt of field.options!) {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        }
        wrap.appendChild(sel);
      } else if (field.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.id = field.key;
        ta.name = field.key;
        ta.required = true;
        if (field.maxlength) ta.maxLength = field.maxlength;
        wrap.appendChild(ta);
      } else {
        const inp = document.createElement('input');
        inp.id = field.key;
        inp.name = field.key;
        inp.required = true;
        if (field.type === 'number' && field.maxlength) {
          inp.type = 'number';
          inp.min = '0';
          inp.step = '1';
          inp.max = String(Math.pow(10, field.maxlength) - 1);
        } else {
          inp.type = field.type;
          if (field.maxlength) inp.maxLength = field.maxlength;
        }
        wrap.appendChild(inp);
      }

      sec.appendChild(wrap);
    }
    form.appendChild(sec);
  }

  const actions = document.createElement('div');
  actions.className = 'nw-form-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'nw-modal-close';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => dlg.remove());

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'nw-form-submit';
  submitBtn.textContent = linkText;

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const values: Record<string, string> = {};
    for (const field of fieldSections.flat()) {
      const el = form.elements.namedItem(field.key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (el) values[field.key] = el.value;
    }
    dlg.remove();
    onSubmit(values);
  });

  dlg.appendChild(form);
  document.body.appendChild(dlg);
  dlg.showModal();
  (form.elements[0] as HTMLElement | undefined)?.focus();
}

// updates the text content of an existing modal's body
export function updateModal(m: Modal, md: string): void {
  const body = m.querySelector('.nw-modal-body');
  if (body) body.textContent = md;
}

// shows the loading spinner, resetting its animation
export function showSpinner(): void {
  const s = document.getElementById('nw-spinner')!;
  s.style.animation = 'none';
  s.style.display = 'flex';
  void s.offsetHeight; // force reflow so animation resets before we remove the override
  s.style.animation = '';
}

// hides the loading spinner
export function hideSpinner(): void {
  const s = document.getElementById('nw-spinner');
  if (s) s.style.display = 'none';
}

// shows a sticky bar notifying the user that a redirect was cancelled, with Continue and Dismiss actions
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
