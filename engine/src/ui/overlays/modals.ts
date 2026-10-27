import { BUTTON_TAG, CLICK_EVENT, DIALOG_TAG } from '../../shared/constants';
import type { Modal } from '../../shared/types';
import { highlightBlock } from '../../markdown/highlight';
import { makeElement } from '../dom';

// removes all open <dialog> elements from the DOM
export function closeModals(): void {
  document.querySelectorAll(DIALOG_TAG).forEach(item => item.remove());
}

// opens a <dialog> modal with rendered markdown content and a close button; onClose runs when the button is clicked
export function showMarkdownModal(markdown: string, closeLabel = 'Close', onClose?: () => void): Modal {
  closeModals();
  const dialog = document.createElement(DIALOG_TAG) as Modal;
  dialog.innerHTML = `<div class="nw-modal-body">${window.newwebRender ? window.newwebRender(markdown) : markdown}</div>
    <button class="nw-modal-close" autofocus>${closeLabel}</button>`;
  dialog.querySelector('.nw-modal-close')!.addEventListener(CLICK_EVENT, () => {
    onClose?.();
    dialog.remove();
  });

  document.body.appendChild(dialog);
  highlightBlock(dialog);
  dialog.showModal();

  return dialog;
}
