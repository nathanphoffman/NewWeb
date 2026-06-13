import { renderPage, showModal, showSuspendedBar, showToast } from './ui.js';

const COMMON_TLDS = ['.com', '.org', '.net', '.io', '.dev', '.app', '.co', '.edu', '.gov', '.uk', '.ca', '.au'];

export function looksLikeBareUrl(href: string): boolean {
  return COMMON_TLDS.some(tld => href.includes(tld));
}

export function fetchMd(url: string): Promise<string> {
  return fetch(url).then(r => r.text());
}

export async function navigateTo(path: string): Promise<void> {
  const mdPath = path.endsWith('.md') ? path : `${path}.md`;
  const md = await fetchMd(mdPath);
  history.pushState({ mdUrl: mdPath }, '', '#' + mdPath);
  renderPage(md);
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

export function parseFields(text: string): Record<string, { type: string; value: null }> {
  const parts = text.split(',').map(s => s.trim());
  parts.pop();
  return parts.reduce((acc: Record<string, { type: string; value: null }>, f) => {
    const name = f.replace(/[*_+]/g, '').trim();
    const type = f.endsWith('*') ? 'password'
               : f.endsWith('_') ? 'select-one'
               : f.endsWith('+') ? 'select-many'
               : 'text';
    acc[name] = { type, value: null };
    return acc;
  }, {});
}
