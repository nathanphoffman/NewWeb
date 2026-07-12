import { closeModals } from './modals.js';
import { addHeadingIds } from './headings.js';
import { annotateLinks } from './wasm-links.js';
import { processImages } from './images.js';
import { highlightBlock } from '../highlight.js';

// waits for #content's opacity transition to finish (with a timeout fallback in case it never fires)
function waitForFadeOut(content: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const done = () => { content.removeEventListener('transitionend', done); resolve(); };
    content.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 260);
  });
}

// smoothly scrolls to the element with the given id
export function scrollToAnchor(id: string): void {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// renders markdown into #content, replacing <img> tags with placeholders, then runs heading ids, link annotation, syntax highlighting, and image loading
// fades the old content out before swapping and back in after, so navigation doesn't pop
export async function renderPage(md: string): Promise<void> {
  closeModals();
  const content = document.getElementById('content')!;
  const isNavigation = content.classList.contains('nw-loaded');
  if (isNavigation) {
    content.classList.remove('nw-loaded');
    await waitForFadeOut(content);
  }
  window.scrollTo(0, 0);
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
  content.classList.add('nw-loaded');
  document.dispatchEvent(new CustomEvent('nw-page-rendered'));
}
