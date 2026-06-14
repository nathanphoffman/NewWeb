const { ipcRenderer } = require('electron');

function stripProtocol(url) {
  return url.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '');
}

function navBtn(label, title, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.title = title;
  btn.style.cssText = [
    'background:#222',
    'border:1px solid #444',
    'border-radius:6px',
    'color:#aaa',
    'font-size:18px',
    'padding:4px 14px',
    'cursor:pointer',
    'line-height:1',
    'flex-shrink:0',
  ].join(';');
  btn.addEventListener('click', onClick);
  return btn;
}

window.addEventListener('DOMContentLoaded', () => {
  const bar = document.createElement('div');
  bar.id = 'nw-electron-bar';
  bar.style.cssText = [
    'display:flex',
    'align-items:center',
    'padding:8px 12px',
    'background:#111',
    'border-bottom:1px solid #333',
    'gap:8px',
  ].join(';');

  const backBtn   = navBtn('←', 'Back (Alt+Left)',   () => window.history.back());
  const reloadBtn = navBtn('↻', 'Reload (Ctrl+R)',   () => window.location.reload());

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'localhost  or  somesite.com';
  input.style.cssText = [
    'flex:1',
    'background:#222',
    'border:1px solid #444',
    'border-radius:6px',
    'color:#ddd',
    'font-family:monospace',
    'font-size:15px',
    'padding:6px 14px',
    'outline:none',
  ].join(';');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const addr = 'newweb://' + stripProtocol(input.value.trim());
      ipcRenderer.send('navigate-to', addr);
      input.blur();
    }
    if (e.key === 'Escape') input.blur();
  });

  bar.appendChild(backBtn);
  bar.appendChild(reloadBtn);
  bar.appendChild(input);
  document.body.prepend(bar);

  ipcRenderer.on('url-changed', (_, url) => {
    input.value = stripProtocol(url);
  });
});
