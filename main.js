const electron = require('electron'); 
const {app, BrowserWindow} = electron;
const path = require('path');
const url = require('url');
const Store = require('./lib/store.js');
const ipc = electron.ipcMain;
const dialog = electron.dialog;

let win = null;

// First instantiate the class
const store = new Store({
    // We'll call our data file 'user-preferences'
    configName: 'user-preferences',
    defaults: {
      // 900x576 is the default size of our window
      windowBounds: { width: 983, height: 614 }
    }
  });

  let { width, height } = store.get('windowBounds');

let boot = () => {
    win = new BrowserWindow(
        {
            width, 
            height,          
            minWidth:540,
            minHeight:375,
            frame:false,
            show:false,
            icon: __dirname +'/icon.ico',
            webPreferences: {
                nodeIntegration: true,
                openDevTools: false
              }
        });

        win.on('resize', () => {
            let { width, height } = win.getBounds();
            store.set('windowBounds', { width, height });
        });
        

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'views/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    //   win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    }); 
    
    win.once('ready-to-show', () => {
        win.show();
    });


    openWith();
}


// const gotTheLock = app.requestSingleInstanceLock()
    
// if (!gotTheLock) {
//   app.quit()
// } else {
//   app.on('second-instance', (event) => {
//     if (win) {
//       if (win.isMinimized()) win.restore()
//       win.focus()
//     }
//   })
// }   

app.on('ready', boot);

app.on('window-all-closed', () => {
    if(process.platform != 'darwin'){
        app.quit();
    }
});

ipc.on('exit', () => {app.quit();});

function openWith(){
    ipc.on('get-file-data', function(event) {
        var data = null
        if (process.argv.length > 1) {
          var openFilePath = process.argv[1];
          data = openFilePath;
        }
        event.returnValue = data
    });
}



