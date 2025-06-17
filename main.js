const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

const { logRequests, requestFilter, debugMode, blockUnknown } = config;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false, // optional: more control
    }
  });

  win.loadURL('https://perchance.org/ai-character-chat');

  const filter = { urls: ['*://*/*'] };

  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    const { url, method } = details;
    let blocked = false;

    // Only filter methods we're interested in
    if (requestFilter.methods.includes(method)) {
      const isBlockedUrl = requestFilter.blockUrls.some(blockedUrl => url.startsWith(blockedUrl));
      const isAllowedUrl = requestFilter.allowUrls.some(allowedUrl => url.startsWith(allowedUrl));

      // Apply blocking logic
      if (isBlockedUrl) {
        blocked = true;
      } else if (blockUnknown && !isAllowedUrl) {
        blocked = true;
      }
    }

    // Debug print
    if (debugMode) {
      console.log(`[${method}] ${url} => ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
    }

    // Optional log to file
    if (logRequests) {
      const logPath = path.join(__dirname, 'logs', 'request.log');
      const logEntry = `[${new Date().toISOString()}] [${method}] ${url} ${blocked ? '[BLOCKED]' : ''}\n`;

      if (!fs.existsSync(path.dirname(logPath))) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
      }

      fs.appendFileSync(logPath, logEntry);
    }

    // Continue or cancel the request
    callback({ cancel: blocked });
  })
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit(); // standard Mac check
});