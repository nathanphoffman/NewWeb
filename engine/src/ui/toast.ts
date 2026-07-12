// shows a self-dismissing toast notification rendered from markdown
export function showToast(md: string, type: string): void {
  const el = document.createElement('div');
  el.className = `nw-toast nw-toast-${type}`;
  el.innerHTML = window.newwebRender ? window.newwebRender(md) : md;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
