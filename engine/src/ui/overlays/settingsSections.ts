import { applyAnimPaused } from '../../themes/theme';
import { BUTTON_TAG, CLICK_EVENT, PAUSED_CLASS, PAUSED_STORAGE_KEY, SPAN_TAG, TRUE_STRING, VIEW_DATA_LABEL } from '../../shared/constants';
import { getMaxImageKb, MAX_IMAGE_KB_LIMIT } from '../../shared/imageLimit';
import { makeElement } from '../dom';

// creates a styled settings section container element
function makeSection(): HTMLElement {
  return makeElement('section', 'nw-settings-section');
}

// builds the "max image size" row and hint, returning the section and its number input
export function buildImageSection(): { section: HTMLElement; input: HTMLInputElement } {
  const section = makeSection();

  const rowElement = makeElement('label', 'nw-settings-row');
  const input = makeElement('input');
  input.type = 'number';
  input.id = 'nw-setting-max-img-kb';
  input.min = '1';
  input.max = String(MAX_IMAGE_KB_LIMIT);
  input.value = String(getMaxImageKb());
  rowElement.append(makeElement(SPAN_TAG, '', 'Max auto-load size (KB)'), input);

  const hint = makeElement('p', 'nw-settings-hint', 'Images larger than this require a manual click to load.');
  section.append(rowElement, hint);

  return { section, input };
}

// builds the row with the button that stops or resumes page animations
export function buildAnimationSection(): HTMLElement {
  const section = makeSection();
  const rowElement = makeElement('div', 'nw-settings-row');
  const isPaused = localStorage.getItem(PAUSED_STORAGE_KEY) === TRUE_STRING;

  const button = makeElement(BUTTON_TAG, 'nw-settings-anim-btn', isPaused ? 'Resume' : 'Stop');
  button.addEventListener(CLICK_EVENT, () => {
    const nowPaused = !document.documentElement.classList.contains(PAUSED_CLASS);
    applyAnimPaused(nowPaused);
    localStorage.setItem(PAUSED_STORAGE_KEY, String(nowPaused));
    button.textContent = nowPaused ? 'Resume' : 'Stop';
  });

  rowElement.append(makeElement(SPAN_TAG, '', 'Page animations'), button);
  section.appendChild(rowElement);

  return section;
}

// builds the session data row, with a "View Data" button that is disabled when nothing is stored
export function buildDataSection(entryCount: number, onViewData: () => void): HTMLElement {
  const hasData = entryCount > 0;
  const section = makeSection();
  const rowElement = makeElement('div', 'nw-settings-row');

  const button = makeElement(BUTTON_TAG, 'nw-settings-data-btn', VIEW_DATA_LABEL);
  button.disabled = !hasData;
  button.classList.toggle('nw-settings-data-btn--empty', !hasData);
  button.addEventListener(CLICK_EVENT, onViewData);

  rowElement.append(makeElement(SPAN_TAG, '', 'Session data'), button);
  section.appendChild(rowElement);

  if (!hasData) section.appendChild(makeElement('p', 'nw-settings-hint', 'No data is currently stored.'));

  return section;
}

// builds the Save / Cancel buttons at the bottom of the dialog
export function buildActions(onSave: () => void, onCancel: () => void): HTMLElement {
  const actions = makeElement('div', 'nw-settings-actions');
  const save = makeElement(BUTTON_TAG, 'nw-settings-save', 'Save');
  const cancel = makeElement(BUTTON_TAG, 'nw-settings-cancel', 'Cancel');

  save.addEventListener(CLICK_EVENT, onSave);
  cancel.addEventListener(CLICK_EVENT, onCancel);
  actions.append(save, cancel);

  return actions;
}

