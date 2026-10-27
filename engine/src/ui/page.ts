import { closeModals } from './overlays/modals';
import { addHeadingIds } from './headings';
import { annotateLinks } from './wasm-links';
import { processImages } from './images';
import { highlightBlock } from '../markdown/highlight';
import { getMaxImageKb } from './overlays/settings';
import { BYTES_PER_KB, FADE_OUT_TIMEOUT_MS } from '../shared/constants';

// waits for #content's opacity transition to finish (with a timeout fallback in case it never fires)
function waitForFadeOut(content: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const done = () => { content.removeEventListener('transitionend', done); resolve(); };
    content.addEventListener('transitionend', done, { once: true });
    setTimeout(done, FADE_OUT_TIMEOUT_MS);
  });
}

// smoothly scrolls to the element with the given id
export function scrollToAnchor(id: string): void {
  const element = document.getElementById(id);

  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// runs heading ids, link annotation, syntax highlighting, and image loading against
// already-present markup — shared by a fresh render and by hydrating pre-rendered
// (statically generated) content that doesn't need to be re-rendered from markdown
function postProcessContent(content: HTMLElement): void {
  addHeadingIds(content);
  annotateLinks(content);
  highlightBlock(content);
  void processImages(content, getMaxImageKb() * BYTES_PER_KB);
  content.classList.add('nw-loaded');
  document.dispatchEvent(new CustomEvent('nw-page-rendered'));
}

// wires up an #content element whose markup was already produced by the static build
// (see build-static.js) instead of being rendered client-side — skips the fetch/wasm-render/
// fade cycle entirely since the markup is already correct, and just runs the same
// post-processing a fresh render would
export function hydrateExistingContent(content: HTMLElement): void {
  postProcessContent(content);
}

// renders markdown into #content, replacing <img> tags with placeholders, then runs heading ids, link annotation, syntax highlighting, and image loading
// fades the old content out before swapping and back in after, so navigation doesn't pop
export async function renderPage(markdown: string): Promise<void> {
  closeModals();
  const content = document.getElementById('content')!;
  const isNavigation = content.classList.contains('nw-loaded');

  if (isNavigation) {
    content.classList.remove('nw-loaded');
    await waitForFadeOut(content);
  }

  window.scrollTo(0, 0);
  const html = window.newwebRender!(markdown).replace(
    // matches every <img> tag and captures its attributes so src and alt can be pulled out
    /<img\b([^>]*)>/gi,
    (_, attrs) => {
      const source = (attrs.match(/src="([^"]*)"/) ?? [])[1] ?? '';
      const altText = (attrs.match(/alt="([^"]*)"/) ?? [])[1] ?? '';

      return `<span class="nw-img-placeholder" data-src="${source}" data-alt="${altText}"></span>`;
    }
  );

  content.innerHTML = html;
  postProcessContent(content);
}
