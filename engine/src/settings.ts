import { applyAnimPaused } from './theme.js';

const MAX_IMAGE_KB_KEY = 'nw-settings-max-image-kb';
const DEFAULT_MAX_IMAGE_KB = 1024;

// reads the max auto-load image size from localStorage, defaulting to 1 MB
export function getMaxImageKb(): number {
  const val = parseInt(localStorage.getItem(MAX_IMAGE_KB_KEY) ?? '', 10);
  return isNaN(val) || val <= 0 ? DEFAULT_MAX_IMAGE_KB : val;
}

// persists the max image KB setting to localStorage
function setMaxImageKb(kb: number): void {
  localStorage.setItem(MAX_IMAGE_KB_KEY, String(kb));
}

// creates a styled settings section container element
function makeSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'nw-settings-section';
  return section;
}

// builds and opens the settings dialog with sections for image size, animations, and session data
export function showSettingsModal(
  getEntries: () => [string, string][],
  onViewData: () => void,
): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());

  const dlg = document.createElement('dialog');
  dlg.className = 'nw-settings-modal';

  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  dlg.appendChild(h2);

  // ── Images ──────────────────────────────────────────────
  const imgSection = makeSection();

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
  imgSection.appendChild(row);

  const imgHint = document.createElement('p');
  imgHint.className = 'nw-settings-hint';
  imgHint.textContent = 'Images larger than this require a manual click to load.';
  imgSection.appendChild(imgHint);
  dlg.appendChild(imgSection);

  // ── Animations ──────────────────────────────────────────
  const animSection = makeSection();

  const animRow = document.createElement('div');
  animRow.className = 'nw-settings-row';

  const animLabel = document.createElement('span');
  const isPaused = localStorage.getItem('nw-paused') === 'true';
  animLabel.textContent = 'Page animations';

  const animBtn = document.createElement('button');
  animBtn.className = 'nw-settings-anim-btn';
  animBtn.textContent = isPaused ? 'Resume' : 'Stop';
  animBtn.addEventListener('click', () => {
    const nowPaused = !document.documentElement.classList.contains('nw-paused');
    applyAnimPaused(nowPaused);
    localStorage.setItem('nw-paused', String(nowPaused));
    animBtn.textContent = nowPaused ? 'Resume' : 'Stop';
  });

  animRow.appendChild(animLabel);
  animRow.appendChild(animBtn);
  animSection.appendChild(animRow);
  dlg.appendChild(animSection);

  // ── Data ────────────────────────────────────────────────
  const dataSection = makeSection();

  const entries = getEntries();
  const hasData = entries.length > 0;

  const dataRow = document.createElement('div');
  dataRow.className = 'nw-settings-row';

  const dataLabel = document.createElement('span');
  dataLabel.textContent = 'Session data';

  const dataBtn = document.createElement('button');
  dataBtn.className = 'nw-settings-data-btn';
  dataBtn.textContent = 'View Data';
  dataBtn.disabled = !hasData;
  if (!hasData) dataBtn.classList.add('nw-settings-data-btn--empty');
  dataBtn.addEventListener('click', () => {
    dlg.remove();
    onViewData();
  });

  dataRow.appendChild(dataLabel);
  dataRow.appendChild(dataBtn);
  dataSection.appendChild(dataRow);

  if (!hasData) {
    const noData = document.createElement('p');
    noData.className = 'nw-settings-hint';
    noData.textContent = 'No data is currently stored.';
    dataSection.appendChild(noData);
  }

  dlg.appendChild(dataSection);

  // ── Actions ─────────────────────────────────────────────
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
