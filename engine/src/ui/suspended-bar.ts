// shows a sticky bar notifying the user that a redirect was cancelled, with Continue and Dismiss actions
export function showSuspendedBar(url: string): void {
  const bar = document.createElement('div');
  bar.id = 'nw-suspended';
  bar.innerHTML = `Redirect to <b>${url}</b> was cancelled.
    <button id="nw-continue">Continue</button>
    <button id="nw-dismiss">Dismiss</button>`;
  bar.querySelector('#nw-continue')!.addEventListener('click', () => { window.location.href = url; });
  bar.querySelector('#nw-dismiss')!.addEventListener('click', () => bar.remove());
  document.body.appendChild(bar);
}
