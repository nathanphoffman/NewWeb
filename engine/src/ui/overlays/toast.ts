import { TOAST_VISIBLE_MS } from '../../shared/constants';

// shows a self-dismissing toast notification rendered from markdown
export function showToast(markdown: string, type: string): void {
  const element = document.createElement('div');
  element.className = `nw-toast nw-toast-${type}`;
  element.innerHTML = window.newwebRender ? window.newwebRender(markdown) : markdown;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), TOAST_VISIBLE_MS);
}
