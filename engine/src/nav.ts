import { renderPage, showModal, showSuspendedBar, showToast, scrollToAnchor } from './ui.js';
import { suggestTheme } from './theme.js';
import { processTemplate } from './template.js';

const COMMON_TLDS = ['.com', '.org', '.net', '.io', '.dev', '.app', '.co', '.edu', '.gov', '.uk', '.ca', '.au'];

export function looksLikeBareUrl(href: string): boolean {
  return COMMON_TLDS.some(tld => href.includes(tld));
}

export function fetchMd(url: string): Promise<string> {
  return fetch(url).then(r => r.text());
}

function applyThemeSuggestion(md: string): void {
  const match = md.match(/<!--\s*themes?\s*:\s*([^-]+?)-->/i);
  if (match) suggestTheme(match[1].split(','));
}

function extractRefreshWasm(md: string): string | null {
  const match = md.match(/<!--\s*refresh\s*:\s*(\S+)\s*-->/i);
  return match ? match[1] : null;
}

function splitAnchor(path: string): [string, string | null] {
  const idx = path.indexOf('#');
  return idx === -1 ? [path, null] : [path.slice(0, idx), path.slice(idx + 1)];
}

export async function navigateTo(path: string): Promise<void> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = basePath.endsWith('.md') ? basePath : `${basePath}.md`;
  const md = await fetchMd(mdPath);
  applyThemeSuggestion(md);
  const hashUrl = anchor ? `${mdPath}#${anchor}` : mdPath;
  history.pushState({ mdUrl: mdPath, anchor: anchor ?? null }, '', '#' + hashUrl);
  renderPage(md);
  if (anchor) scrollToAnchor(anchor);
}

export async function navigateWithData(path: string, data: Record<string, unknown>): Promise<void> {
  const [basePath, anchor] = splitAnchor(path);
  const mdPath = basePath.endsWith('.md') ? basePath : `${basePath}.md`;
  const raw = await fetchMd(mdPath);
  applyThemeSuggestion(raw);
  const md = await processTemplate(raw, data);
  const hashUrl = anchor ? `${mdPath}#${anchor}` : mdPath;
  history.pushState({ mdUrl: mdPath, anchor: anchor ?? null }, '', '#' + hashUrl);
  renderPage(md);
  if (anchor) scrollToAnchor(anchor);
}

export async function renderNoData(mdPath: string): Promise<void> {
  const raw = await fetchMd(mdPath);
  applyThemeSuggestion(raw);
  const refreshWasm = extractRefreshWasm(raw);
  if (refreshWasm) {
    const notice = `> _This page requires data to display._ [Load now](wasm:${refreshWasm})\n\n`;
    renderPage(await processTemplate(notice + raw, {}));
  } else {
    renderPage(raw);
  }
}

export async function replacePage(path: string, anchor: string | null = null): Promise<void> {
  const mdPath = path.endsWith('.md') ? path : `${path}.md`;
  const hashUrl = anchor ? `${mdPath}#${anchor}` : mdPath;
  history.replaceState({ mdUrl: mdPath, anchor }, '', '#' + hashUrl);
  await renderNoData(mdPath);
}

export async function handleMore(a: HTMLAnchorElement): Promise<void> {
  const url = a.getAttribute('href')!.replace('more:', '');
  const md = await fetchMd(url);
  showModal(md);
}

export async function handleNav(a: HTMLAnchorElement): Promise<void> {
  await navigateTo(a.getAttribute('href')!);
}

export function warnBareUrl(href: string): void {
  showToast(`Link "${href}" looks like a URL — did you mean https://${href}?`, 'error');
}

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

export function suspendPage(url: string): void {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(a => (a as HTMLAnchorElement).dataset.suspended = 'true');
  showSuspendedBar(url);
}

