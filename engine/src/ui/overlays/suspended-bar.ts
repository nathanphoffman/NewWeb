import { BUTTON_TAG, CLICK_EVENT } from '../../shared/constants';
import { makeElement } from '../dom';

// shows a sticky bar notifying the user that a redirect was cancelled, with Continue and Dismiss actions
export function showSuspendedBar(address: string): void {
  const navBar = makeElement('div');
  navBar.id = 'nw-suspended';

  const target = makeElement('b', '', address);
  const continueButton = makeElement(BUTTON_TAG, '', 'Continue');
  continueButton.id = 'nw-continue';
  const dismissButton = makeElement(BUTTON_TAG, '', 'Dismiss');
  dismissButton.id = 'nw-dismiss';

  continueButton.addEventListener(CLICK_EVENT, () => { window.location.href = address; });
  dismissButton.addEventListener(CLICK_EVENT, () => navBar.remove());

  navBar.append('Redirect to ', target, ' was cancelled. ', continueButton, ' ', dismissButton);
  document.body.appendChild(navBar);
}
