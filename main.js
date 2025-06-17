import { app, BrowserWindow, ipcMain, session } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, appendFileSync } from 'fs';

import { logRequests, requestFilter, debugMode } from './config.json';

const storagePath = join(__dirname, 'storage');
if (!existsSync(storagePath)) {
  mkdirSync(storagePath);
}

const logDir = join(__dirname, 'logs');
if (!existsSync(logDir)) {
  mkdirSync(logDir);
}
const logPath = join(logDir, "latest.log")
appendFileSync(logPath, 'App started at ' + new Date().toISOString() + '\n');

function logToFile(message) {
  if (logRequests) {
    const timestamp = new Date().toISOString();
    appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  }
}

function isAllowed(url, method) {
  const { allowUrls, blockUrls, methods, allowUnknown } = requestFilter;

  if (!methods.includes(method)) return false;

  if (blockUrls.some(blocked => url.startsWith(blocked))) return false;
  if (allowUrls.some(allowed => url.startsWith(allowed))) return true;

  return allowUnknown; // Default result true
}

app.setPath('userData', join(__dirname, 'storage'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  win.loadURL("https://perchance.org/ai-character-chat")

  if (debugMode) {
    win.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  const ses = session.defaultSession;

  ses.webRequest.onBeforeRequest((details, callback) => {
    const { url, method } = details;
    const allowed = isAllowed(url, method);

    if (!allowed) {
      logToFile(`BLOCKED: ${method} ${url}`);
      return callback({ cancel: true });
    }

    if (method === 'POST' && details.uploadData) {
      try {
        const body = Buffer.concat(details.uploadData.map(p => p.bytes)).toString();
        logToFile(`POST BODY: ${url} => ${body}`);
      } catch (err) {
        logToFile(`ERROR reading POST body from ${url}`);
      }
    }
    
    logToFile(`ALLOWED: ${method} ${url}`);
    return callback({ cancel: false });
  });
  createWindow();
});
