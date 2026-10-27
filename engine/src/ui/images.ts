import { makeElement } from './dom';
import { BUTTON_TAG, CLICK_EVENT, DECIMAL_RADIX, DIALOG_TAG, ERROR_EVENT } from '../shared/constants';

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

// builds an <img> with its source and alt text
function makeImage(source: string, altText: string, className = ''): HTMLImageElement {
  const image = makeElement('img', className);
  image.alt = altText;
  image.src = source;

  return image;
}

// builds a <figcaption> for the alt text, or nothing when there is none
function makeCaption(altText: string, className: string): HTMLElement[] {
  return altText ? [makeElement('figcaption', className, altText)] : [];
}

// opens an image in a fullscreen lightbox dialog
function showLightbox(source: string, altText: string): void {
  const dialog = makeElement(DIALOG_TAG, 'nw-lightbox');
  const close = makeElement(BUTTON_TAG, 'nw-lightbox__close', '×');
  close.setAttribute('aria-label', 'Close');

  dialog.append(close, makeImage(source, altText), ...makeCaption(altText, 'nw-lightbox__caption'));
  dialog.addEventListener(CLICK_EVENT, () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
}

// wraps an image in a <figure> with optional caption; clicking opens the lightbox.
// The frame stays collapsed until the image actually loads, then eases open
// (see .nw-image-frame__reveal in images.css) instead of popping in and shoving
// the rest of the page down instantly.
function buildFrame(source: string, altText: string, onOpen: (source: string, altText: string) => void): HTMLElement {
  const figure = makeElement('figure', 'nw-image-frame');
  const reveal = makeElement('div', 'nw-image-frame__reveal');
  const inner = makeElement('div', 'nw-image-frame__inner');

  // both outcomes reveal the frame, so a broken image doesn't leave an empty collapsed gap
  const onReady = () => figure.classList.add('nw-image-frame--loaded');
  const image = makeElement('img', 'nw-image-frame__img');
  image.alt = altText;
  image.addEventListener('load', onReady, { once: true });
  image.addEventListener(ERROR_EVENT, onReady, { once: true });
  image.src = source;

  inner.append(image, ...makeCaption(altText, 'nw-image-frame__caption'));
  reveal.appendChild(inner);
  figure.appendChild(reveal);
  figure.addEventListener(CLICK_EVENT, () => onOpen(source, altText));

  return figure;
}

// creates a button that loads an oversized image on demand instead of auto-loading it
function buildFallback(altText: string, loadFrame: () => HTMLElement): HTMLElement {
  const text = 'Image size is beyond set limit, click to load it anyway.';
  const button = makeElement(BUTTON_TAG, 'nw-img-load-btn', altText ? `${altText} — ${text}` : text);
  button.addEventListener(CLICK_EVENT, () => button.replaceWith(loadFrame()));

  return button;
}

// replaces nw-img-placeholder spans with framed images or fallback buttons based on size
export async function processImages(container: Element, maxBytes: number): Promise<void> {
  const placeholders = Array.from(
    container.querySelectorAll<HTMLElement>('span.nw-img-placeholder')
  );

  // each placeholder is checked independently so one slow image doesn't hold up the rest
  await Promise.all(placeholders.map(async span => {
    const source = span.dataset.src ?? '';
    const altText = span.dataset.alt ?? '';
    const allowed = await checkSize(source, maxBytes);

    // the lightbox and frame builder are passed in so the call chain stays shallow
    const frame = () => buildFrame(source, altText, showLightbox);
    span.replaceWith(allowed ? frame() : buildFallback(altText, frame));
  }));
}
