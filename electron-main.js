// Electron entry: starts Express server and opens a BrowserWindow
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  const startUrl = 'http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/index.html';
  mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function startServer() {
  // Start the Express server in the same process to simplify (require server.js)
  // server.js listens on PORT or 3000
  require(path.join(__dirname, 'server.js'));
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


