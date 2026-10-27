import { applyAnimPaused } from './theme';
import { PAUSED_CLASS, PAUSED_STORAGE_KEY } from './constants';
import { makeElement } from './ui/dom';

const MAX_IMAGE_KB_KEY = 'nw-settings-max-image-kb';
const DEFAULT_MAX_IMAGE_KB = 1024;
const MAX_IMAGE_KB_LIMIT = 10240;

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
  return makeElement('section', 'nw-settings-section');
}

// builds the "max image size" row and hint, returning the section and its number input
function buildImageSection(): { section: HTMLElement; input: HTMLInputElement } {
  const section = makeSection();

  const row = makeElement('label', 'nw-settings-row');
  const input = makeElement('input');
  input.type = 'number';
  input.id = 'nw-setting-max-img-kb';
  input.min = '1';
  input.max = String(MAX_IMAGE_KB_LIMIT);
  input.value = String(getMaxImageKb());
  row.append(makeElement('span', '', 'Max auto-load size (KB)'), input);

  const hint = makeElement('p', 'nw-settings-hint', 'Images larger than this require a manual click to load.');
  section.append(row, hint);

  return { section, input };
}

// builds the row with the button that stops or resumes page animations
function buildAnimationSection(): HTMLElement {
  const section = makeSection();
  const row = makeElement('div', 'nw-settings-row');
  const isPaused = localStorage.getItem(PAUSED_STORAGE_KEY) === 'true';

  const button = makeElement('button', 'nw-settings-anim-btn', isPaused ? 'Resume' : 'Stop');
  button.addEventListener('click', () => {
    const nowPaused = !document.documentElement.classList.contains(PAUSED_CLASS);
    applyAnimPaused(nowPaused);
    localStorage.setItem(PAUSED_STORAGE_KEY, String(nowPaused));
    button.textContent = nowPaused ? 'Resume' : 'Stop';
  });

  row.append(makeElement('span', '', 'Page animations'), button);
  section.appendChild(row);

  return section;
}

// builds the session data row, with a "View Data" button that is disabled when nothing is stored
function buildDataSection(hasData: boolean, onViewData: () => void): HTMLElement {
  const section = makeSection();
  const row = makeElement('div', 'nw-settings-row');

  const button = makeElement('button', 'nw-settings-data-btn', 'View Data');
  button.disabled = !hasData;
  button.classList.toggle('nw-settings-data-btn--empty', !hasData);
  button.addEventListener('click', onViewData);

  row.append(makeElement('span', '', 'Session data'), button);
  section.appendChild(row);

  if (!hasData) section.appendChild(makeElement('p', 'nw-settings-hint', 'No data is currently stored.'));

  return section;
}

// builds the Save / Cancel buttons at the bottom of the dialog
function buildActions(onSave: () => void, onCancel: () => void): HTMLElement {
  const actions = makeElement('div', 'nw-settings-actions');
  const save = makeElement('button', 'nw-settings-save', 'Save');
  const cancel = makeElement('button', 'nw-settings-cancel', 'Cancel');

  save.addEventListener('click', onSave);
  cancel.addEventListener('click', onCancel);
  actions.append(save, cancel);

  return actions;
}

// builds and opens the settings dialog with sections for image size, animations, and session data
export function showSettingsModal(
  getEntries: () => [string, string][],
  onViewData: () => void,
): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());

  const dlg = makeElement('dialog', 'nw-settings-modal');
  const images = buildImageSection();

  const save = () => {
    const val = parseInt(images.input.value, 10);
    if (!isNaN(val) && val > 0) setMaxImageKb(val);
    dlg.remove();
  };
  const viewData = () => {
    dlg.remove();
    onViewData();
  };

  dlg.append(
    makeElement('h2', '', 'Settings'),
    images.section,
    buildAnimationSection(),
    buildDataSection(getEntries().length > 0, viewData),
    buildActions(save, () => dlg.remove()),
  );

  document.body.appendChild(dlg);
  dlg.showModal();
}
