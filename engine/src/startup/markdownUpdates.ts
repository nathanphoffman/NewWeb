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

let isLoggedIn = false;

export function setLoggedIn(value: boolean): void {
  isLoggedIn = value;
}

export function getIsLoggedIn(): boolean {
  return isLoggedIn;
}

export function updateAuthButtons(onEdit: () => void, onAdd: () => void): void {
  const menu = document.getElementById('nw-bar-menu')!;
  const settings = document.getElementById('nw-settings')!;
  let editBtn = document.getElementById('nw-edit') as HTMLButtonElement | null;
  let addBtn  = document.getElementById('nw-add')  as HTMLButtonElement | null;
  if (isLoggedIn) {
    if (!editBtn) {
      editBtn = document.createElement('button');
      editBtn.id = 'nw-edit';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', onEdit);
      menu.insertBefore(editBtn, settings);
    }
    if (!addBtn) {
      addBtn = document.createElement('button');
      addBtn.id = 'nw-add';
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', onAdd);
      menu.insertBefore(addBtn, editBtn);
    }
  } else {
    addBtn?.remove();
    editBtn?.remove();
  }
}
