import { showDataModal, store } from "./engineCode";

export function updateViewDataBtn(): void {
  const menu = document.getElementById('nw-bar-menu')!;
  let btn = document.getElementById('nw-view-data') as HTMLButtonElement | null;
  if (store.size > 0) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'nw-view-data';
      btn.textContent = 'View Data';
      btn.addEventListener('click', showDataModal);
      const settings = document.getElementById('nw-settings')!;
      menu.insertBefore(btn, settings);
    }
  } else {
    btn?.remove();
  }
}
