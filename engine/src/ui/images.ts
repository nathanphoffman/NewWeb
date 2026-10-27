import { BYTES_PER_KB } from '../constants';
import { getMaxImageKb } from '../settings';

// HEAD-checks an image URL and returns true if it fits within the configured max size
async function checkSize(src: string): Promise<boolean> {
  if (src.startsWith('data:')) return true;
  try {
    const res = await fetch(src, { method: 'HEAD' });
    const cl = res.headers.get('content-length');
    if (cl === null) return true;
    return parseInt(cl, 10) <= getMaxImageKb() * BYTES_PER_KB;
  } catch (err) {
    // a failed size check shouldn't block the image, so allow it
    console.warn(`Could not check size of ${src}:`, err);
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

// wraps an image in a <figure> with optional caption; clicking opens the lightbox.
// The frame stays collapsed until the image actually loads, then eases open
// (see .nw-image-frame__reveal in images.css) instead of popping in and shoving
// the rest of the page down instantly.
function buildFrame(src: string, alt: string, onOpen: (src: string, alt: string) => void): HTMLElement {
  const fig = document.createElement('figure');
  fig.className = 'nw-image-frame';

  const reveal = document.createElement('div');
  reveal.className = 'nw-image-frame__reveal';
  const inner = document.createElement('div');
  inner.className = 'nw-image-frame__inner';

  const img = document.createElement('img');
  img.alt = alt;
  img.className = 'nw-image-frame__img';
  const onReady = () => fig.classList.add('nw-image-frame--loaded');
  img.addEventListener('load', onReady, { once: true });
  img.addEventListener('error', onReady, { once: true });
  img.src = src;
  inner.appendChild(img);

  if (alt) {
    const cap = document.createElement('figcaption');
    cap.className = 'nw-image-frame__caption';
    cap.textContent = alt;
    inner.appendChild(cap);
  }

  reveal.appendChild(inner);
  fig.appendChild(reveal);
  fig.addEventListener('click', () => onOpen(src, alt));
  return fig;
}

// creates a button that loads an oversized image on demand instead of auto-loading it
function buildFallback(alt: string, loadFrame: () => HTMLElement): HTMLElement {
  const btn = document.createElement('button');
  const text = "Image size is beyond set limit, click to load it anyway.";

  btn.className = 'nw-img-load-btn';
  btn.textContent = alt ? `${alt} — ${text}` : text;
  btn.addEventListener('click', () => btn.replaceWith(loadFrame()));
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
    // the lightbox and frame builder are passed in so the call chain stays shallow
    const frame = () => buildFrame(src, alt, showLightbox);
    span.replaceWith(allowed ? frame() : buildFallback(alt, frame));
  }));
}
