import { renderPage, showModal, showSuspendedBar, showToast, scrollToAnchor } from './ui.js';
import { applyThemeSuggestion, suggestTheme } from './theme.js';
import { applyTitleDirective } from './title.js';
import { applyLogoDirective } from './logo.js';
import { processIncludes } from './include.js';
import { processTemplate } from './template.js';

const COMMON_TLDS = ['.com', '.org', '.net', '.io', '.dev', '.app', '.co', '.edu', '.gov', '.uk', '.ca', '.au'];

// returns true if the href contains a common TLD, suggesting it's an external URL missing https://
export function looksLikeBareUrl(href: string): boolean {
  return COMMON_TLDS.some(tld => href.includes(tld));
}

// fetches the text content of a markdown file
export function fetchMd(url: string): Promise<string> {
  return fetch(url).then(r => r.text());
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

// fetches and renders a markdown page, pushing a new browser history entry
export async function navigateTo(path: string): Promise<void> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = basePath.endsWith('.md') ? basePath : `${basePath}.md`;
  const md = await fetchMd(mdPath);
  applyThemeSuggestion(md);
  applyTitleDirective(md);
  applyLogoDirective(md);
  const composed = await processIncludes(md);
  history.pushState({ mdUrl: mdPath, anchor: anchor ?? null }, '', prettyUrl(mdPath, anchor));
  renderPage(composed);
  if (anchor) scrollToAnchor(anchor);
}

// like navigateTo but runs the markdown through template processing with data before rendering
export async function navigateWithData(path: string, data: Record<string, unknown>): Promise<void> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = basePath.endsWith('.md') ? basePath : `${basePath}.md`;
  const raw = await fetchMd(mdPath);
  applyThemeSuggestion(raw);
  applyTitleDirective(raw);
  applyLogoDirective(raw);
  const composed = await processIncludes(raw);
  const md = await processTemplate(composed, data);
  history.pushState({ mdUrl: mdPath, anchor: anchor ?? null }, '', prettyUrl(mdPath, anchor));
  renderPage(md);
  if (anchor) scrollToAnchor(anchor);
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
    renderPage(await processTemplate(notice + composed, {}));
  } else {
    renderPage(composed);
  }
}

// like navigateTo but replaces the current history entry instead of pushing a new one
export async function replacePage(path: string, anchor: string | null = null): Promise<void> {
  const mdPath = path.endsWith('.md') ? path : `${path}.md`;
  history.replaceState({ mdUrl: mdPath, anchor }, '', prettyUrl(mdPath, anchor));
  await renderNoData(mdPath);
}

// fetches markdown from a "more:" link and displays it in a modal
export async function handleMore(a: HTMLAnchorElement): Promise<void> {
  const url = a.getAttribute('href')!.replace('more:', '');
  const md = await fetchMd(url);
  showModal(md);
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
  let crossDomain = false;
  try {
    crossDomain = new URL(url).hostname !== window.location.hostname;
  } catch (_) { /* relative url — same origin */ }

  if (!crossDomain) {
    window.location.href = url;
    return;
  }

  let count = 3;
  const dlg = showModal(
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
  }, 1000);
  dlg.onCancel = () => { clearInterval(interval); suspendPage(url); };
}

// marks all wasm links as suspended and shows a bar letting the user resume or dismiss a cancelled redirect
export function suspendPage(url: string): void {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(a => (a as HTMLAnchorElement).dataset.suspended = 'true');
  showSuspendedBar(url);
}

