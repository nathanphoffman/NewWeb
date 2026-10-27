import { BUTTON_TAG, CLICK_EVENT, VIEW_DATA_LABEL } from '../shared/constants';
import { showDataModal, store } from "./engineCode";

// shows the "View Data" menu button when the store has entries, removes it when empty
export function updateViewDataBtn(): void {
  const menu = document.getElementById('nw-bar-menu')!;
  let button = document.getElementById('nw-view-data') as HTMLButtonElement | null;

  if (store.size > 0) {
    if (!button) {
      button = document.createElement(BUTTON_TAG);
      button.id = 'nw-view-data';
      button.textContent = VIEW_DATA_LABEL;
      button.addEventListener(CLICK_EVENT, showDataModal);
      const settings = document.getElementById('nw-settings')!;
      menu.insertBefore(button, settings);
    }
  } else {
    button?.remove();
  }
}
