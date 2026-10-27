import { MS_PER_SECOND } from './constants';
import { renderPage, scrollToAnchor } from './ui/page';
import { showMarkdownModal } from './ui/modals';
import { showSuspendedBar } from './ui/suspended-bar';
import { showToast } from './ui/toast';
import { applyThemeSuggestion } from './theme';
import { applyTitleDirective } from './title';
import { applyLogoDirective } from './logo';
import { processIncludes } from './include';
import { processTemplate } from './template';
import { toRootRelative } from './utility';

const COMMON_TLDS = ['.com', '.org', '.net', '.io', '.dev', '.app', '.co', '.edu', '.gov', '.uk', '.ca', '.au'];

// returns true if the href contains a common TLD, suggesting it's an external URL missing https://
export function looksLikeBareUrl(href: string): boolean {
  return COMMON_TLDS.some(tld => href.includes(tld));
}

// fetches the text content of a markdown file
function fetchMd(url: string): Promise<string> {
  return fetch(toRootRelative(url)).then(r => r.text());
}

// reads a <!-- refresh: <file> --> comment from markdown, returning the wasm file path if present
function extractRefreshWasm(md: string): string | null {
  const match = md.match(/<!--\s*refresh\s*:\s*(\S+)\s*-->/i);
  return match ? match[1] : null;
}

// splits a path like "page.md#section" into ["page.md", "section"]
function splitAnchor(path: string): [string, string | null] {
  const idx = path.indexOf('#');
  return idx === -1 ? [path, null] : [path.slice(0, idx), path.slice(idx + 1)];
}

// strips a trailing .md so the address bar shows the pretty path
function prettyUrl(mdPath: string, anchor: string | null): string {
  const base = mdPath.endsWith('.md') ? mdPath.slice(0, -3) : mdPath;
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  return anchor ? `${withSlash}#${anchor}` : withSlash;
}

// resolves a path to its markdown url, fetches it, applies its page directives and expands includes
async function loadPageMarkdown(path: string): Promise<{ mdPath: string; anchor: string | null; composed: string }> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = toRootRelative(basePath.endsWith('.md') ? basePath : `${basePath}.md`);
  const raw = await fetchMd(mdPath);

  applyThemeSuggestion(raw);
  applyTitleDirective(raw);
  applyLogoDirective(raw);

  return { mdPath, anchor, composed: await processIncludes(raw) };
}

// pushes a browser history entry for the page, renders it and scrolls to its anchor
async function showPage(mdPath: string, anchor: string | null, md: string): Promise<void> {
  history.pushState({ mdUrl: mdPath, anchor }, '', prettyUrl(mdPath, anchor));
  await renderPage(md);
  if (anchor) scrollToAnchor(anchor);
}

// fetches and renders a markdown page, pushing a new browser history entry
export async function navigateTo(path: string): Promise<void> {
  const { mdPath, anchor, composed } = await loadPageMarkdown(path);
  await showPage(mdPath, anchor, composed);
}

// like navigateTo but runs the markdown through template processing with data before rendering
export async function navigateWithData(path: string, data: Record<string, unknown>): Promise<void> {
  const { mdPath, anchor, composed } = await loadPageMarkdown(path);
  await showPage(mdPath, anchor, await processTemplate(composed, data));
}

// renders a page without wasm data; prepends a "load now" prompt if the page declares a wasm dependency
export async function renderNoData(mdPath: string): Promise<void> {
  const raw = await fetchMd(mdPath);
  applyThemeSuggestion(raw);
  applyTitleDirective(raw);
  applyLogoDirective(raw);
  const refreshWasm = extractRefreshWasm(raw);
  const composed = await processIncludes(raw);
  if (refreshWasm) {
    const notice = `> _This page requires data to display._ [Load now](wasm:${refreshWasm})\n\n`;
    await renderPage(await processTemplate(notice + composed, {}));
  } else {
    await renderPage(composed);
  }
}

// like navigateTo but replaces the current history entry instead of pushing a new one
export async function replacePage(path: string, anchor: string | null = null): Promise<void> {
  const mdPath = toRootRelative(path.endsWith('.md') ? path : `${path}.md`);
  history.replaceState({ mdUrl: mdPath, anchor }, '', prettyUrl(mdPath, anchor));
  await renderNoData(mdPath);
}

// fetches markdown from a "more:" link and displays it in a modal
export async function handleMore(a: HTMLAnchorElement): Promise<void> {
  const url = a.getAttribute('href')!.replace('more:', '');
  const md = await fetchMd(url);
  showMarkdownModal(md);
}

// navigates to the href of an anchor element
export async function handleNav(a: HTMLAnchorElement): Promise<void> {
  await navigateTo(a.getAttribute('href')!);
}

// shows an error toast suggesting the user add https:// to a link that looks like a bare URL
export function warnBareUrl(href: string): void {
  showToast(`Link "${href}" looks like a URL — did you mean https://${href}?`, 'error');
}

// navigates to a URL; for cross-domain URLs shows a countdown modal giving the user a chance to cancel
export function handleRedirect(url: string, reason?: string): void {
  // resolving against the current page makes relative urls same-origin instead of throwing
  const crossDomain = new URL(url, window.location.href).hostname !== window.location.hostname;

  if (!crossDomain) {
    window.location.href = url;
    return;
  }

  let count = 3;
  const dlg = showMarkdownModal(
    `### Leaving site\n${reason ? `_${reason}_\n\n` : ''}` +
    `Navigating to \`${url}\` in <span id="nw-countdown">${count}</span>s…`,
    'Cancel Redirect'
  );
  const countEl = () => dlg.querySelector('#nw-countdown');
  const interval = setInterval(() => {
    count--;
    if (countEl()) countEl()!.textContent = String(count);
    if (count === 0) {
      clearInterval(interval);
      dlg.remove();
      window.location.href = url;
    }
  }, MS_PER_SECOND);
  dlg.onCancel = () => { clearInterval(interval); suspendPage(url); };
}

// marks all wasm links as suspended and shows a bar letting the user resume or dismiss a cancelled redirect
function suspendPage(url: string): void {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(a => (a as HTMLAnchorElement).dataset.suspended = 'true');
  showSuspendedBar(url);
}

