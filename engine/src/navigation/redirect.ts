import { MS_PER_SECOND } from '../shared/constants';
import { showMarkdownModal } from '../ui/overlays/modals';
import { showSuspendedBar } from '../ui/overlays/suspended-bar';
import type { Modal } from '../shared/types';

const REDIRECT_COUNTDOWN_SECONDS = 3;

// resolving against the current page makes relative urls same-origin instead of throwing
function isCrossDomain(address: string): boolean {
  return new URL(address, window.location.href).hostname !== window.location.hostname;
}

// builds the markdown shown in the "leaving site" modal
function leavingSiteMarkdown(address: string, reason?: string): string {
  const reasonLine = reason ? `_${reason}_\n\n` : '';

  return `### Leaving site\n${reasonLine}` +
    `Navigating to \`${address}\` in <span id="nw-countdown">${REDIRECT_COUNTDOWN_SECONDS}</span>s…`;
}

// ticks the modal's countdown down each second and navigates when it reaches zero; returns the timer id
function startCountdown(dialog: Modal, address: string): number {
  let count = REDIRECT_COUNTDOWN_SECONDS;
  const interval = window.setInterval(() => {
    count--;
    const countEl = dialog.querySelector('#nw-countdown');

    if (countEl) countEl.textContent = String(count);

    if (count > 0) return;

    clearInterval(interval);
    dialog.remove();
    window.location.href = address;
  }, MS_PER_SECOND);

  return interval;
}

// marks all wasm links as suspended and shows a bar letting the user resume or dismiss a cancelled redirect
function suspendPage(address: string): void {
  document.querySelectorAll('a[href^="wasm:"]')
    .forEach(anchor => (anchor as HTMLAnchorElement).dataset.suspended = 'true');
  showSuspendedBar(address);
}

// navigates to a URL; for cross-domain URLs shows a countdown modal giving the user a chance to cancel
export function handleRedirect(address: string, reason?: string): void {
  if (!isCrossDomain(address)) {
    window.location.href = address;

    return;
  }

  let interval: number | undefined;

  const cancel = () => { clearInterval(interval); suspendPage(address); };
  const dialog = showMarkdownModal(leavingSiteMarkdown(address, reason), 'Cancel Redirect', cancel);

  interval = startCountdown(dialog, address);
}
