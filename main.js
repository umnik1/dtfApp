const {
  app,
  BrowserWindow,
  getCurrentWindow,
  globalShortcut,
  remote,
  ipcMain,
  nativeImage
} = require('electron');
const path = require('path');
const BadgeGenerator = require('./badge_generator.js');

const {
  ElectronBlocker,
  fullLists
} = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const {
  readFileSync,
  writeFileSync
} = require('fs');
const contextMenu = require('electron-context-menu');

contextMenu({
  showSaveImageAs: true,
  showInspectElement: false,
});

let mainWindow;
let subWindow;
const badgeDescription = 'New notification';
let currentOverlayIcon = {
  image: null,
  badgeDescription
};

const jsCode = `
var body = document.querySelector("body");
var appPanel = document.createElement("div");       
appPanel.id = "appPanel";
body.appendChild(appPanel);

var link = document.createElement('link')
link.setAttribute('rel', 'stylesheet')
link.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons')
document.head.appendChild(link)

var minimize = document.createElement("span");
minimize.className = "material-icons material-icons-outlined";
minimize.id = "appMinimize";
minimize.textContent="remove";
document.getElementById('appPanel').appendChild(minimize);

var full = document.createElement("span");
full.className = "material-icons material-icons-outlined";
full.id = "appFull";
full.textContent="crop_square";
document.getElementById('appPanel').appendChild(full);

var close = document.createElement("span");
close.className = "material-icons material-icons-outlined";
close.id = "appClose";
close.textContent="close";
document.getElementById('appPanel').appendChild(close);

var back = document.createElement("span");
back.className = "material-icons material-icons-outlined";
back.id = "appBack";
back.textContent="arrow_back";
document.getElementById('appPanel').appendChild(back);

setTimeout(function() { 
  document.getElementById('appMinimize').addEventListener('click', function (e) {
    const { remote } = require('electron')
    var window = remote.BrowserWindow.getFocusedWindow()
    window.minimize()
  })
  document.getElementById('appFull').addEventListener('click', function (e) {
    const { remote } = require('electron')
    var window = remote.BrowserWindow.getFocusedWindow()
    window.isMaximized() ? window.unmaximize() : window.maximize();
  })
  document.getElementById('appClose').addEventListener('click', function (e) {
    const { remote } = require('electron')
    var window = remote.BrowserWindow.getFocusedWindow()
    window.close();
  })
  document.getElementById('appBack').addEventListener('click', function (e) {
    const { remote } = require('electron')
    var window = remote.BrowserWindow.getFocusedWindow()
    window.webContents.goBack();
  })
}, 100)

`;

const jsBadge = `
  const { ipcRenderer } = require('electron');
  var notif;
  setInterval(function() {
    notif = document.getElementsByClassName('head-notifies__badge')[1].textContent.replace(/\s/g, '');
    if (notif > 0) {
      ipcRenderer.sendSync('update-badge', notif);
    } else {
      ipcRenderer.sendSync('update-badge', null);
    }

  }, 5000);
`;

async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
      enableRemoteModule: true,
    },
    height: 800,
    width: 1250,
    frame: false,
    backgroundColor: '#212226',
    title: 'DTF',
    icon: __dirname + '/icon.png',
  });

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists, {
      enableCompression: true,
    }, {
      path: 'engine.bin',
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  );
  blocker.enableBlockingInSession(mainWindow.webContents.session);

  // new Badge(mainWindow);
  let generator = new BadgeGenerator(mainWindow);

  ipcMain.on('update-badge', (event, arg) => {
    if (arg) {
      generator.generate(arg).then((base64) => {
        const image = nativeImage.createFromDataURL(base64);
        currentOverlayIcon = {
          image,
          badgeDescription
        }
        mainWindow.setOverlayIcon(currentOverlayIcon.image, currentOverlayIcon.badgeDescription)
      });
    } else {
      mainWindow.setOverlayIcon(null, '')
    }
    event.returnValue = "success"
  })

  mainWindow.loadURL('https://dtf.ru');

  mainWindow.webContents.on('dom-ready', function () {
    mainWindow.webContents.insertCSS(readFileSync(path.join(__dirname, 'dark.css'), 'utf8'))
  });

  mainWindow.webContents.on('dom-ready', function () {
    mainWindow.webContents.executeJavaScript(jsCode)
    mainWindow.webContents.executeJavaScript(jsBadge)
  });

  mainWindow.webContents.on('new-window', function (e, url) {
    if (url.toLowerCase().indexOf("dtf.ru") === -1) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    } else {
      e.preventDefault()
      createSubWindow(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  var reload = () => {
    mainWindow.reload()
  }

  globalShortcut.register('F5', reload);

}

async function createSubWindow(url) {
  subWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
      enableRemoteModule: true,
    },
    height: 700,
    frame: false,
    backgroundColor: '#212226',
  });

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists, {
      enableCompression: true,
    }, {
      path: 'engine.bin',
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  );
  blocker.enableBlockingInSession(subWindow.webContents.session);

  subWindow.loadURL(url);

  subWindow.webContents.on('dom-ready', function () {
    subWindow.webContents.insertCSS(readFileSync(path.join(__dirname, 'dark.css'), 'utf8'))
  });

  subWindow.webContents.on('dom-ready', function () {
    subWindow.webContents.executeJavaScript(jsCode)
  });

  subWindow.webContents.on('new-window', function (e, url) {
    if (url.toLowerCase().indexOf("dtf.ru") === -1) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    } else {
      e.preventDefault()
      createSubWindow(url);
    }
  });

  subWindow.on('closed', () => {
    subWindow = null;
  });

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})