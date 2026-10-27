import { MS_PER_SECOND } from '../shared/constants';
import { showMarkdownModal } from '../ui/overlays/modals';
import { showSuspendedBar } from '../ui/overlays/suspended-bar';
import type { Modal } from '../shared/types';

const REDIRECT_COUNTDOWN_SECONDS = 3;

// resolving against the current page makes relative urls same-origin instead of throwing
function isCrossDomain(url: string): boolean {
  return new URL(url, window.location.href).hostname !== window.location.hostname;
}

// builds the markdown shown in the "leaving site" modal
function leavingSiteMarkdown(url: string, reason?: string): string {
  const reasonLine = reason ? `_${reason}_\n\n` : '';

  return `### Leaving site\n${reasonLine}` +
    `Navigating to \`${url}\` in <span id="nw-countdown">${REDIRECT_COUNTDOWN_SECONDS}</span>s…`;
}

// ticks the modal's countdown down each second and navigates when it reaches zero; returns the timer id
function startCountdown(dlg: Modal, url: string): number {
  let count = REDIRECT_COUNTDOWN_SECONDS;
  const interval = window.setInterval(() => {
    count--;
    const countEl = dlg.querySelector('#nw-countdown');

    if (countEl) countEl.textContent = String(count);

    if (count > 0) return;

    clearInterval(interval);
    dlg.remove();
    window.location.href = url;
  }, MS_PER_SECOND);

  return interval;
}

// marks all wasm links as suspended and shows a bar letting the user resume or dismiss a cancelled redirect
function suspendPage(url: string): void {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(a => (a as HTMLAnchorElement).dataset.suspended = 'true');
  showSuspendedBar(url);
}

// navigates to a URL; for cross-domain URLs shows a countdown modal giving the user a chance to cancel
export function handleRedirect(url: string, reason?: string): void {
  if (!isCrossDomain(url)) {
    window.location.href = url;

    return;
  }

  let interval: number | undefined;

  const cancel = () => { clearInterval(interval); suspendPage(url); };
  const dlg = showMarkdownModal(leavingSiteMarkdown(url, reason), 'Cancel Redirect', cancel);

  interval = startCountdown(dlg, url);
}
