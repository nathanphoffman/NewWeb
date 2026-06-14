const fs = require('fs');
const path = require('path');

// On Linux AppImages, chrome-sandbox can't be SUID root (no root during install),
// so Electron's sandbox check fatals before JS even runs — app.commandLine.appendSwitch
// is too late. Fix: remove the sandbox binary and wrap the electron executable in a
// shell script that passes --no-sandbox at the OS level before Electron starts.
exports.default = async function(context) {
  if (context.electronPlatformName !== 'linux') return;

  const { appOutDir } = context;
  const execName = context.packager.executableName;

  // Remove chrome-sandbox — without it, Electron won't fatal on missing SUID perms
  const sandbox = path.join(appOutDir, 'chrome-sandbox');
  if (fs.existsSync(sandbox)) fs.unlinkSync(sandbox);

  // Rename the real binary and replace it with a wrapper that passes --no-sandbox
  const realBin = path.join(appOutDir, execName);
  const wrappedBin = path.join(appOutDir, `${execName}-bin`);
  fs.renameSync(realBin, wrappedBin);
  fs.writeFileSync(realBin,
    `#!/bin/bash\nexec "$(dirname "$0")/${execName}-bin" --no-sandbox "$@"\n`,
    { mode: 0o755 }
  );
};
