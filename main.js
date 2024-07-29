const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");

let win;

function createWindow() {

  win = new BrowserWindow({
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
});

  win.loadFile("index.html");

  win.maximize();
  // win.webContents.openDevTools({mode:'undocked'}) // enable only when debugging

  win.setIgnoreMouseEvents(true, { forward: true });
  
  globalShortcut.register('Control+S' , () => { // blur character window and disable interaction with control + s
    win.setIgnoreMouseEvents(true, { forward: true });
    win.blur();
  })

  globalShortcut.register('Control+D' , () => { // focus on character window and enable interaction with control + d
    win.setIgnoreMouseEvents(false);
    win.focus()
  })
}

app.on('ready', function () {
  setTimeout(function() {
      createWindow();
  }, 300);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});