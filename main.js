const electron = require('electron'); 
const {app, BrowserWindow} = electron;
const path = require('path');
const url = require('url');
const Store = require('./lib/store.js');
const ipc = electron.ipcMain;
const dialog = electron.dialog;

let win;

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
    })
}

app.on('ready', boot);

app.on('window-all-closed', () => {
    if(process.platform != 'darwin'){
        app.quit();
    }
});

ipc.on('exit', () => {app.quit();});

ipc.on('open-about-dialog', (event) => {
    openAbout();
})

function openAbout(){
    const aboutpath = path.join('file://', __dirname, 'views/about.html')
    let about = new BrowserWindow({
        frame:false,
        parent:win,
        modal:true,
        width:400, 
        height:180,
        show:false,
        resizable:false,
        backgroundColor: '#424242'
    })
    about.on('closed', () => { about = null})
    about.loadURL(aboutpath) 

    about.once('ready-to-show', () => {
        about.show();
    });
}