const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      partition: 'persist:perchance-storage'
    }
  });

  win.loadURL('https://perchance.org/ai-character-chat');
}

app.whenReady().then(createWindow);

ipcMain.handle('load-memory', async () => {
  try {
    return fs.readFileSync('./storage/perchance-mem.json', 'utf-8');
  } catch (e) {
    return '{}';
  }
});

ipcMain.handle('save-memory', async (event, data) => {
  fs.writeFileSync('./storage/perchance-mem.json', data);
});
