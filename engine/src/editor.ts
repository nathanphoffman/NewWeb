import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';

let activeView: EditorView | null = null;

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
    color: 'var(--fg)',
    backgroundColor: 'var(--bg)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  '.cm-content': {
    padding: '1rem 0',
    caretColor: 'var(--fg)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--fg)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--link) 25%, transparent)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--link) 25%, transparent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg)',
    color: 'var(--muted)',
    border: 'none',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
});

function mountEditor(parent: HTMLElement, doc: string): EditorView {
  if (activeView) activeView.destroy();
  activeView = new EditorView({
    doc,
    extensions: [basicSetup, markdown(), EditorView.lineWrapping, editorTheme],
    parent,
  });
  return activeView;
}

function destroyEditor(): void {
  if (activeView) {
    activeView.destroy();
    activeView = null;
  }
}

export function showEditModal(
  filename: string,
  initialContent: string,
  onSave: (content: string) => void,
): void {
  document.querySelectorAll<HTMLDialogElement>('.nw-editor-modal').forEach(d => { d.close(); d.remove(); });
  destroyEditor();

  const dlg = document.createElement('dialog');
  dlg.className = 'nw-editor-modal';

  const toolbar = document.createElement('div');
  toolbar.className = 'nw-editor-toolbar';

  const title = document.createElement('span');
  title.className = 'nw-editor-title';
  title.textContent = filename;

  const actions = document.createElement('div');
  actions.className = 'nw-editor-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'nw-editor-save';
  saveBtn.textContent = 'Save';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'nw-editor-close';
  closeBtn.textContent = 'Close';

  actions.appendChild(saveBtn);
  actions.appendChild(closeBtn);
  toolbar.appendChild(title);
  toolbar.appendChild(actions);

  const cmContainer = document.createElement('div');
  cmContainer.className = 'nw-editor-cm';

  dlg.appendChild(toolbar);
  dlg.appendChild(cmContainer);
  document.body.appendChild(dlg);
  dlg.showModal();

  const view = mountEditor(cmContainer, initialContent);

  saveBtn.addEventListener('click', () => {
    const content = view.state.doc.toString();
    destroyEditor();
    dlg.close();
    dlg.remove();
    onSave(content);
  });

  closeBtn.addEventListener('click', () => {
    destroyEditor();
    dlg.close();
    dlg.remove();
  });

  dlg.addEventListener('cancel', () => destroyEditor());
}

export function showAddModal(
  onSave: (filepath: string, content: string) => void,
): void {
  document.querySelectorAll<HTMLDialogElement>('.nw-editor-modal').forEach(d => { d.close(); d.remove(); });
  destroyEditor();

  const dlg = document.createElement('dialog');
  dlg.className = 'nw-editor-modal';

  const toolbar = document.createElement('div');
  toolbar.className = 'nw-editor-toolbar';

  const filepathInput = document.createElement('input');
  filepathInput.type = 'text';
  filepathInput.className = 'nw-editor-filepath';
  filepathInput.placeholder = 'File path, e.g. /docs/post.md';

  const actions = document.createElement('div');
  actions.className = 'nw-editor-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'nw-editor-save';
  saveBtn.textContent = 'Save';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'nw-editor-close';
  closeBtn.textContent = 'Close';

  actions.appendChild(saveBtn);
  actions.appendChild(closeBtn);
  toolbar.appendChild(filepathInput);
  toolbar.appendChild(actions);

  const cmContainer = document.createElement('div');
  cmContainer.className = 'nw-editor-cm';

  dlg.appendChild(toolbar);
  dlg.appendChild(cmContainer);
  document.body.appendChild(dlg);
  dlg.showModal();

  const view = mountEditor(cmContainer, '');
  filepathInput.focus();

  saveBtn.addEventListener('click', () => {
    const filepath = filepathInput.value.trim();
    if (!filepath) {
      filepathInput.focus();
      filepathInput.style.outline = '2px solid var(--link, currentColor)';
      return;
    }
    const content = view.state.doc.toString();
    destroyEditor();
    dlg.close();
    dlg.remove();
    onSave(filepath, content);
  });

  closeBtn.addEventListener('click', () => {
    destroyEditor();
    dlg.close();
    dlg.remove();
  });

  dlg.addEventListener('cancel', () => destroyEditor());
}
