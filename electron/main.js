const { app, BrowserWindow, shell, protocol, net, ipcMain, Menu } = require('electron');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([{
  scheme: 'newweb',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

app.whenReady().then(() => {
  protocol.handle('newweb', (request) => {
    const url = new URL(request.url);
    if (url.hostname === 'localhost') {
      const p = url.pathname || '/';
      const filePath = path.join(ROOT, p === '/' ? 'shell.html' : p);
      return net.fetch('file://' + filePath);
    }
    return new Response(`Remote NewWeb sites not yet supported: ${url.hostname}`, { status: 501 });
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(ROOT, 'shell.html'));

  win.webContents.on('did-navigate', (_, url) => {
    // don't reflect the shell's own file:// load in the address bar
    if (!url.startsWith('file://')) win.webContents.send('url-changed', url);
  });

  ipcMain.on('navigate-to', (_, url) => {
    const parsed = new URL(url);
    // ports are meaningless in newweb:// — strip them
    // pathname is '' for bare hostnames in non-special protocols in Node.js, treat as '/'
    const pathname = parsed.pathname || '/';
    const base = `newweb://${parsed.hostname}${pathname}${parsed.search}`;
    // bare root with no hash → load main.md via hash
    const target = (pathname === '/' && !parsed.hash)
      ? base + '#main'
      : base + parsed.hash;
    win.loadURL(target);
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (/^https?:\/\//.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Navigation',
      submenu: [
        { label: 'Back',   accelerator: 'Alt+Left',  click: () => win.webContents.goBack() },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.reload() },
      ],
    },
  ]));
});

app.on('window-all-closed', () => app.quit());
