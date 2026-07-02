const { app, BrowserWindow, shell, protocol, net, ipcMain, Menu } = require('electron');
const path = require('path');

// dev: __dirname is electron/, site assets live in ../setup (the same lean build degit ships)
// packaged: extraResources land in resources/, pointed to by process.resourcesPath
const ROOT = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'setup');

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([{
  scheme: 'newweb',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

// Chromium strips ports from custom scheme origins (newweb://localhost:3000 → newweb://localhost),
// so we encode the target port in the subdomain instead: localhost:3000 → 3000.localhost.
// This keeps the port visible to the protocol handler via url.hostname.
function getProxyPort(hostname) {
  const m = hostname.match(/^(\d+)\.localhost$/);
  return m ? m[1] : null;
}

// Paths that belong to the browser itself — always served from disk
function isBrowserAsset(pathname) {
  return pathname === '/' ||
    pathname === '/index.html' ||
    pathname.startsWith('/engine/');
}

// Private/LAN hosts can't have real SSL certs — allow HTTP for them
function isPrivateHost(hostname) {
  if (hostname.endsWith('.local')) return true;
  const ipv4 = hostname.match(/^(\d+)\.(\d+)/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 10 || a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
  }
  return false;
}

// Fetch remote content and reject HTML responses — only markdown sites are supported
async function fetchContent(fetchUrl, displayHost) {
  let res;
  try {
    res = await net.fetch(fetchUrl);
  } catch (err) {
    const md = `# Cannot Connect\n\nCould not reach **${displayHost}**.\n\n\`\`\`\n${err.message}\n\`\`\``;
    return new Response(md, { headers: { 'Content-Type': 'text/plain' } });
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    const md = `# Not a NewWeb Site\n\n**${displayHost}** returned an HTML page instead of a markdown file.\n\nOnly sites that serve \`.md\` files can be viewed in the NewWeb browser.`;
    return new Response(md, { headers: { 'Content-Type': 'text/plain' } });
  }
  return res;
}

app.whenReady().then(() => {
  protocol.handle('newweb', (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname || '/';
    const proxyPort = getProxyPort(url.hostname);

    // app-chrome landing page — ships with the app itself, not with the site build in ROOT
    if (pathname === '/welcome.md') {
      return net.fetch('file://' + path.join(__dirname, 'welcome.md'));
    }

    if (url.hostname === 'localhost' || proxyPort) {
      if (isBrowserAsset(pathname)) {
        const filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
        return net.fetch('file://' + filePath);
      }
      if (proxyPort) {
        return fetchContent(`http://localhost:${proxyPort}${pathname}`, `localhost:${proxyPort}`);
      }
      return net.fetch('file://' + path.join(ROOT, pathname));
    }

    // external NewWeb site — browser assets still from disk, content fetched remotely
    if (isBrowserAsset(pathname)) {
      const filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
      return net.fetch('file://' + filePath);
    }
    const scheme = isPrivateHost(url.hostname) ? 'http' : 'https';
    return fetchContent(`${scheme}://${url.hostname}${pathname}${url.search}`, url.hostname);
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

  win.loadURL('newweb://localhost/#welcome');

  win.webContents.on('did-navigate', (_, url) => {
    if (url.startsWith('file://')) return;
    const parsed = new URL(url);
    const proxyPort = getProxyPort(parsed.hostname);
    // suppress the startup welcome page from the address bar
    if (parsed.hostname === 'localhost' && !proxyPort &&
        (!parsed.hash || /^#welcome(\.md)?$/.test(parsed.hash))) return;
    // display port-encoded hostnames as localhost:PORT
    const displayHost = proxyPort ? `localhost:${proxyPort}` : parsed.hostname;
    const displayHash = parsed.hash.replace(/^#(main|main\.md|welcome|welcome\.md)$/, '');
    win.webContents.send('url-changed', `${displayHost}${parsed.pathname !== '/' ? parsed.pathname : ''}${displayHash}`);
  });

  ipcMain.on('navigate-to', (_, url) => {
    const parsed = new URL(url);
    // encode port as subdomain: localhost:3000 → 3000.localhost
    const hostname = parsed.port ? `${parsed.port}.localhost` : parsed.hostname;
    const pathname = parsed.pathname || '/';
    const base = `newweb://${hostname}${pathname}${parsed.search}`;
    const target = (pathname === '/' && !parsed.hash) ? base + '#main' : base + parsed.hash;
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
        { label: 'Back',   accelerator: 'Alt+Left',    click: () => win.webContents.goBack() },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.reload() },
      ],
    },
  ]));
});

app.on('window-all-closed', () => app.quit());
