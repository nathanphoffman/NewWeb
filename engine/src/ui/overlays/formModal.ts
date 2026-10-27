import { BUTTON_TAG, CLICK_EVENT, DIALOG_TAG } from '../../shared/constants';
import type { FieldDef } from '../../shared/types';
import { makeElement, openDialog } from '../dom';
import { closeModals } from './modals';

// builds an <option> with the same text as its value
function buildOption(text: string): HTMLOptionElement {
  const option = makeElement('option', '', text);
  option.value = text;

  return option;
}

// builds the disabled, pre-selected first option that asks the user to choose
function buildPlaceholderOption(label: string): HTMLOptionElement {
  const placeholder = buildOption('');
  placeholder.textContent = `Choose ${label}…`;
  placeholder.disabled = true;
  placeholder.selected = true;

  return placeholder;
}

// builds the <select> control for a dropdown field, starting on a disabled placeholder
function buildSelect(field: FieldDef): HTMLSelectElement {
  const select = makeElement('select');
  select.id = field.key;
  select.name = field.key;
  select.required = true;
  select.append(buildPlaceholderOption(field.label), ...field.options!.map(buildOption));

  return select;
}

// builds the <input> for a field; a number field with a digit limit gets a max of all 9s (3 digits -> 999)
function buildInput(field: FieldDef): HTMLInputElement {
  const input = makeElement('input');
  input.id = field.key;
  input.name = field.key;
  input.required = true;

  if (field.type === 'number' && field.maxlength) {
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.max = String(10 ** field.maxlength - 1);
  } else {
    input.type = field.type;

    if (field.maxlength) input.maxLength = field.maxlength;
  }

  return input;
}

// builds the <textarea> control for a multi-line field
function buildTextarea(field: FieldDef): HTMLTextAreaElement {
  const textarea = makeElement('textarea');
  textarea.id = field.key;
  textarea.name = field.key;
  textarea.required = true;

  if (field.maxlength) textarea.maxLength = field.maxlength;

  return textarea;
}

// builds a labelled form field using the control that matches its type
function buildField(field: FieldDef): HTMLElement {
  const wrap = makeElement('div', 'nw-form-field');
  const label = makeElement('label', '', field.label);
  label.htmlFor = field.key;

  let control: HTMLElement;

  if (field.type === 'select') control = buildSelect(field);
  else if (field.type === 'textarea') control = buildTextarea(field);
  else control = buildInput(field);

  wrap.append(label, control);

  return wrap;
}

// builds the Cancel / submit buttons at the bottom of a form
function buildFormActions(linkText: string, dialog: HTMLElement): HTMLElement {
  const actions = makeElement('div', 'nw-form-actions');

  const cancelBtn = makeElement(BUTTON_TAG, 'nw-modal-close', 'Cancel');
  cancelBtn.type = BUTTON_TAG;
  cancelBtn.addEventListener(CLICK_EVENT, () => dialog.remove());

  const submitBtn = makeElement(BUTTON_TAG, 'nw-form-submit', linkText);
  submitBtn.type = 'submit';

  actions.append(cancelBtn, submitBtn);

  return actions;
}

// reads the current value of every field in the form, keyed by field key
function readFormValues(form: HTMLFormElement, fields: FieldDef[]): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of fields) {
    const control = form.elements.namedItem(field.key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

    if (control) values[field.key] = control.value;
  }

  return values;
}

// builds the form: one section per group of fields, then the Cancel / submit buttons
function buildForm(linkText: string, fieldSections: FieldDef[][], dialog: HTMLElement): HTMLFormElement {
  const form = makeElement('form');
  form.noValidate = false;

  for (const fields of fieldSections) {
    const section = makeElement('div', 'nw-form-section');
    section.append(...fields.map(buildField));
    form.appendChild(section);
  }

  form.appendChild(buildFormActions(linkText, dialog));

  return form;
}

// builds and opens a form dialog for collecting user input before running a wasm script
export function showFormModal(
  linkText: string,
  fieldSections: FieldDef[][],
  onSubmit: (values: Record<string, string>) => void
): void {
  closeModals();
  const dialog = makeElement(DIALOG_TAG, 'nw-form-modal');
  const form = buildForm(linkText, fieldSections, dialog);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = readFormValues(form, fieldSections.flat());
    dialog.remove();
    onSubmit(values);
  });

  dialog.append(makeElement('h3', 'nw-form-title', `Input Required for '${linkText}'`), form);
  openDialog(dialog);
  (form.elements[0] as HTMLElement | undefined)?.focus();
}
