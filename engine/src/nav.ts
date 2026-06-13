import { renderPage, showModal, showSuspendedBar } from './ui.js';

export function fetchMd(url: string): Promise<string> {
  return fetch(url).then(r => r.text());
}

export async function navigateTo(url: string): Promise<void> {
  const md = await fetchMd(url);
  history.pushState({ mdUrl: url }, '', '#' + url);
  renderPage(md);
}

export async function handleMd(a: HTMLAnchorElement): Promise<void> {
  await navigateTo(a.getAttribute('href')!.replace('md:', ''));
}

export async function handleMore(a: HTMLAnchorElement): Promise<void> {
  const url = a.getAttribute('href')!.replace('more:', '');
  const md = await fetchMd(url);
  showModal(md);
}

export async function handleNav(a: HTMLAnchorElement): Promise<void> {
  await navigateTo(a.getAttribute('href')!);
}

export function handleRedirect(url: string, reason?: string): void {
  if (url.startsWith('md:')) {
    navigateTo(url.slice(3));
    return;
  }

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
