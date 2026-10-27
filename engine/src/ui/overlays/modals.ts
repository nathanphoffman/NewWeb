import type { FieldDef, Modal } from '../../shared/types';
import { highlightBlock } from '../../markdown/highlight';
import { makeElement } from '../dom';

// removes all open <dialog> elements from the DOM
export function closeModals(): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());
}

// opens a <dialog> modal with rendered markdown content and a close button; onClose runs when the button is clicked
export function showMarkdownModal(md: string, closeLabel = 'Close', onClose?: () => void): Modal {
  closeModals();
  const dlg = document.createElement('dialog') as Modal;
  dlg.innerHTML = `<div class="nw-modal-body">${window.newwebRender ? window.newwebRender(md) : md}</div>
    <button class="nw-modal-close" autofocus>${closeLabel}</button>`;
  dlg.querySelector('.nw-modal-close')!.addEventListener('click', () => {
    onClose?.();
    dlg.remove();
  });

  document.body.appendChild(dlg);
  highlightBlock(dlg);
  dlg.showModal();

  return dlg;
}

// builds the <select> control for a dropdown field, starting on a disabled placeholder
function buildSelect(field: FieldDef): HTMLSelectElement {
  const select = makeElement('select');

  select.id = field.key;

  select.name = field.key;

  select.required = true;

  const blank = makeElement('option', '', `Choose ${field.label}…`);
  blank.value = '';
  blank.disabled = true;
  blank.selected = true;

  select.appendChild(blank);

  for (const optionText of field.options!) {
    const option = makeElement('option', '', optionText);
    option.value = optionText;

    select.appendChild(option);
  }

  return select;
}

// builds the <input> control for a field; number fields get a max of all 9s for their digit limit
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
function buildFormActions(linkText: string, dlg: HTMLElement): HTMLElement {
  const actions = makeElement('div', 'nw-form-actions');

  const cancelBtn = makeElement('button', 'nw-modal-close', 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.addEventListener('click', () => dlg.remove());

  const submitBtn = makeElement('button', 'nw-form-submit', linkText);
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

// builds and opens a form dialog for collecting user input before running a wasm script
export function showFormModal(
  linkText: string,
  fieldSections: FieldDef[][],
  onSubmit: (values: Record<string, string>) => void
): void {
  closeModals();
  const dlg = makeElement('dialog', 'nw-form-modal');
  const form = makeElement('form');
  form.noValidate = false;

  for (const fields of fieldSections) {
    const section = makeElement('div', 'nw-form-section');
    section.append(...fields.map(buildField));
    form.appendChild(section);
  }

  form.appendChild(buildFormActions(linkText, dlg));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const values = readFormValues(form, fieldSections.flat());
    dlg.remove();
    onSubmit(values);
  });

  dlg.append(makeElement('h3', 'nw-form-title', `Input Required for '${linkText}'`), form);
  document.body.appendChild(dlg);
  dlg.showModal();
  (form.elements[0] as HTMLElement | undefined)?.focus();
}
