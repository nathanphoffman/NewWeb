import { getMaxImageKb } from '../settings.js';

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
export async function processImages(container: Element): Promise<void> {
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
