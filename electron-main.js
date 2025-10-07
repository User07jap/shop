// Electron entry: starts Express server and opens a BrowserWindow
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, 'public/assets/placeholder.svg'), // You can add an icon later
    title: 'SHOP.CO - Desktop App',
    show: false // Don't show until ready
  });
  
  // Load the main user interface (not admin)
  const startUrl = 'http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/index.html';
  
  mainWindow.loadURL(startUrl).then(() => {
    // Show window when content is loaded
    mainWindow.show();
    mainWindow.focus();
  }).catch((err) => {
    console.error('Failed to load URL:', err);
    mainWindow.show();
    mainWindow.focus();
  });
  
  mainWindow.on('closed', () => { mainWindow = null; });
  
  // Ensure proper input handling
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Ensure all inputs are focusable
      document.addEventListener('DOMContentLoaded', function() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.removeAttribute('readonly');
          input.removeAttribute('disabled');
          input.style.pointerEvents = 'auto';
          input.style.userSelect = 'text';
        });
      });
    `);
  });
  
  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'SHOP.CO',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.loadURL('http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/index.html');
          }
        },
        {
          label: 'Products',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.loadURL('http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/products.html');
          }
        },
        {
          label: 'Cart',
          accelerator: 'CmdOrCtrl+C',
          click: () => {
            mainWindow.loadURL('http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/cart.html');
          }
        },
        { type: 'separator' },
        {
          label: 'Seller Dashboard',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.loadURL('http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/seller/index.html');
          }
        },
        { type: 'separator' },
        {
          label: 'Admin Panel (Web)',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            shell.openExternal('http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/admin/index.html');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'close', label: 'Close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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


