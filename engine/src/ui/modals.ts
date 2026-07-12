import type { FieldDef, Modal } from '../types';
import { highlightBlock } from '../highlight';

// removes all open <dialog> elements from the DOM
export function closeModals(): void {
  document.querySelectorAll('dialog').forEach(d => d.remove());
}

// opens a <dialog> modal with rendered markdown content and a close button
export function showModal(md: string, closeLabel = 'Close'): Modal {
  closeModals();
  const dlg = document.createElement('dialog') as Modal;
  dlg.innerHTML = `<div class="nw-modal-body">${window.newwebRender ? window.newwebRender(md) : md}</div>
    <button class="nw-modal-close" autofocus>${closeLabel}</button>`;
  dlg.querySelector('.nw-modal-close')!.addEventListener('click', () => {
    if (dlg.onCancel) dlg.onCancel();
    dlg.remove();
  });
  document.body.appendChild(dlg);
  highlightBlock(dlg);
  dlg.showModal();
  return dlg;
}

// builds and opens a form dialog for collecting user input before running a wasm script
export function showFormModal(
  linkText: string,
  fieldSections: FieldDef[][],
  onSubmit: (values: Record<string, string>) => void
): void {
  closeModals();
  const dlg = document.createElement('dialog');
  dlg.className = 'nw-form-modal';

  const title = document.createElement('h3');
  title.className = 'nw-form-title';
  title.textContent = `Input Required for '${linkText}'`;
  dlg.appendChild(title);

  const form = document.createElement('form');
  form.noValidate = false;

  for (const section of fieldSections) {
    const sec = document.createElement('div');
    sec.className = 'nw-form-section';
    for (const field of section) {
      const wrap = document.createElement('div');
      wrap.className = 'nw-form-field';

      const lbl = document.createElement('label');
      lbl.htmlFor = field.key;
      lbl.textContent = field.label;
      wrap.appendChild(lbl);

      if (field.type === 'select') {
        const sel = document.createElement('select');
        sel.id = field.key;
        sel.name = field.key;
        sel.required = true;
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = `Choose ${field.label}…`;
        blank.disabled = true;
        blank.selected = true;
        sel.appendChild(blank);
        for (const opt of field.options!) {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        }
        wrap.appendChild(sel);
      } else if (field.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.id = field.key;
        ta.name = field.key;
        ta.required = true;
        if (field.maxlength) ta.maxLength = field.maxlength;
        wrap.appendChild(ta);
      } else {
        const inp = document.createElement('input');
        inp.id = field.key;
        inp.name = field.key;
        inp.required = true;
        if (field.type === 'number' && field.maxlength) {
          inp.type = 'number';
          inp.min = '0';
          inp.step = '1';
          inp.max = String(Math.pow(10, field.maxlength) - 1);
        } else {
          inp.type = field.type;
          if (field.maxlength) inp.maxLength = field.maxlength;
        }
        wrap.appendChild(inp);
      }

      sec.appendChild(wrap);
    }
    form.appendChild(sec);
  }

  const actions = document.createElement('div');
  actions.className = 'nw-form-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'nw-modal-close';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => dlg.remove());

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'nw-form-submit';
  submitBtn.textContent = linkText;

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const values: Record<string, string> = {};
    for (const field of fieldSections.flat()) {
      const el = form.elements.namedItem(field.key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (el) values[field.key] = el.value;
    }
    dlg.remove();
    onSubmit(values);
  });

  dlg.appendChild(form);
  document.body.appendChild(dlg);
  dlg.showModal();
  (form.elements[0] as HTMLElement | undefined)?.focus();
}

// updates the text content of an existing modal's body
export function updateModal(m: Modal, md: string): void {
  const body = m.querySelector('.nw-modal-body');
  if (body) body.textContent = md;
}
