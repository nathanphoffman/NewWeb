import { showDataModal, store } from "./engineCode";

// shows the "View Data" menu button when the store has entries, removes it when empty
export function updateViewDataBtn(): void {
  const menu = document.getElementById('nw-bar-menu')!;
  let button = document.getElementById('nw-view-data') as HTMLButtonElement | null;

  if (store.size > 0) {
    if (!button) {
      button = document.createElement('button');
      button.id = 'nw-view-data';
      button.textContent = 'View Data';
      button.addEventListener('click', showDataModal);
      const settings = document.getElementById('nw-settings')!;
      menu.insertBefore(button, settings);
    }
  } else {
    button?.remove();
  }
}
