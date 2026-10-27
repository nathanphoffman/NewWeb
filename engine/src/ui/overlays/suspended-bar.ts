import { makeElement } from '../dom';

// shows a sticky bar notifying the user that a redirect was cancelled, with Continue and Dismiss actions
export function showSuspendedBar(url: string): void {
  const bar = makeElement('div');
  bar.id = 'nw-suspended';

  const target = makeElement('b', '', url);
  const continueButton = makeElement('button', '', 'Continue');
  continueButton.id = 'nw-continue';
  const dismissButton = makeElement('button', '', 'Dismiss');
  dismissButton.id = 'nw-dismiss';

  continueButton.addEventListener('click', () => { window.location.href = url; });
  dismissButton.addEventListener('click', () => bar.remove());

  bar.append('Redirect to ', target, ' was cancelled. ', continueButton, ' ', dismissButton);
  document.body.appendChild(bar);
}
