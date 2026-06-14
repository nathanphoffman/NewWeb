const MAX_IMAGE_KB_KEY = 'nw-settings-max-image-kb';
const DEFAULT_MAX_IMAGE_KB = 200;

export function getMaxImageKb(): number {
  const val = parseInt(localStorage.getItem(MAX_IMAGE_KB_KEY) ?? '', 10);
  return isNaN(val) || val <= 0 ? DEFAULT_MAX_IMAGE_KB : val;
}

function setMaxImageKb(kb: number): void {
  localStorage.setItem(MAX_IMAGE_KB_KEY, String(kb));
}

export function showSettingsModal(): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());

  const dlg = document.createElement('dialog');
  dlg.className = 'nw-settings-modal';

  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  dlg.appendChild(h2);

  const section = document.createElement('section');
  section.className = 'nw-settings-section';

  const h3 = document.createElement('h3');
  h3.textContent = 'Images';
  section.appendChild(h3);

  const row = document.createElement('label');
  row.className = 'nw-settings-row';
  const rowLabel = document.createElement('span');
  rowLabel.textContent = 'Max auto-load size (KB)';
  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'nw-setting-max-img-kb';
  input.min = '1';
  input.max = '10240';
  input.value = String(getMaxImageKb());
  row.appendChild(rowLabel);
  row.appendChild(input);
  section.appendChild(row);

  const hint = document.createElement('p');
  hint.className = 'nw-settings-hint';
  hint.textContent = 'Images larger than this require a manual click to load.';
  section.appendChild(hint);

  dlg.appendChild(section);

  const actions = document.createElement('div');
  actions.className = 'nw-settings-actions';

  const save = document.createElement('button');
  save.className = 'nw-settings-save';
  save.textContent = 'Save';
  save.addEventListener('click', () => {
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val > 0) setMaxImageKb(val);
    dlg.remove();
  });

  const cancel = document.createElement('button');
  cancel.className = 'nw-settings-cancel';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => dlg.remove());

  actions.appendChild(save);
  actions.appendChild(cancel);
  dlg.appendChild(actions);

  document.body.appendChild(dlg);
  dlg.showModal();
}

document.getElementById('nw-settings')!.addEventListener('click', showSettingsModal);
