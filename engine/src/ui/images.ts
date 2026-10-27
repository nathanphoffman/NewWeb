import { DECIMAL_RADIX } from '../shared/constants';

// HEAD-checks an image URL and returns true if it fits within the configured max size
async function checkSize(source: string, maxBytes: number): Promise<boolean> {
  if (source.startsWith('data:')) return true;

  try {
    const response = await fetch(source, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');

    if (contentLength === null) return true;

    return parseInt(contentLength, DECIMAL_RADIX) <= maxBytes;
  } catch (error) {
    // a failed size check shouldn't block the image, so allow it
    console.warn(`Could not check size of ${source}:`, error);

    return true;
  }
}

// opens an image in a fullscreen lightbox dialog
function showLightbox(source: string, altText: string): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'nw-lightbox';
  const close = document.createElement('button');
  close.className = 'nw-lightbox__close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close');
  const image = document.createElement('img');
  image.src = source;
  image.alt = altText;
  dialog.appendChild(close);
  dialog.appendChild(image);

  if (altText) {
    const caption = document.createElement('figcaption');
    caption.className = 'nw-lightbox__caption';
    caption.textContent = altText;
    dialog.appendChild(caption);
  }

  dialog.addEventListener('click', () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
}

// wraps an image in a <figure> with optional caption; clicking opens the lightbox.
// The frame stays collapsed until the image actually loads, then eases open
// (see .nw-image-frame__reveal in images.css) instead of popping in and shoving
// the rest of the page down instantly.
function buildFrame(source: string, altText: string, onOpen: (source: string, altText: string) => void): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'nw-image-frame';

  const reveal = document.createElement('div');
  reveal.className = 'nw-image-frame__reveal';
  const inner = document.createElement('div');
  inner.className = 'nw-image-frame__inner';

  const image = document.createElement('img');
  image.alt = altText;
  image.className = 'nw-image-frame__img';

  const onReady = () => figure.classList.add('nw-image-frame--loaded');
  image.addEventListener('load', onReady, { once: true });
  image.addEventListener('error', onReady, { once: true });
  image.src = source;
  inner.appendChild(image);

  if (altText) {
    const caption = document.createElement('figcaption');
    caption.className = 'nw-image-frame__caption';
    caption.textContent = altText;
    inner.appendChild(caption);
  }

  reveal.appendChild(inner);
  figure.appendChild(reveal);
  figure.addEventListener('click', () => onOpen(source, altText));

  return figure;
}

// creates a button that loads an oversized image on demand instead of auto-loading it
function buildFallback(altText: string, loadFrame: () => HTMLElement): HTMLElement {
  const button = document.createElement('button');
  const text = "Image size is beyond set limit, click to load it anyway.";

  button.className = 'nw-img-load-btn';
  button.textContent = altText ? `${altText} — ${text}` : text;
  button.addEventListener('click', () => button.replaceWith(loadFrame()));

  return button;
}

// replaces nw-img-placeholder spans with framed images or fallback buttons based on size
export async function processImages(container: Element, maxBytes: number): Promise<void> {
  const placeholders = Array.from(
    container.querySelectorAll<HTMLElement>('span.nw-img-placeholder')
  );

  await Promise.all(placeholders.map(async span => {
    const source = span.dataset.src ?? '';
    const altText = span.dataset.alt ?? '';
    const allowed = await checkSize(source, maxBytes);

    // the lightbox and frame builder are passed in so the call chain stays shallow
    const frame = () => buildFrame(source, altText, showLightbox);
    span.replaceWith(allowed ? frame() : buildFallback(altText, frame));
  }));
}
