import {app, BrowserWindow, ipcMain, Menu} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

let win: BrowserWindow | null;
const folderPath = path.join(os.homedir(), '..', 'Public', 'AppData', 'esnaadm-v2'); // Saves to Desktop

async function init() {
    await app.whenReady();
    await fs.promises.mkdir(folderPath, {recursive: true});
    await fs.promises.mkdir(path.join(folderPath, 'data'), {recursive: true});
    await fs.promises.mkdir(path.join(folderPath, 'app'), {recursive: true});
    let indexHtmlPath = path.join(folderPath, 'app', 'index.html');
    try {
        await fs.promises.access(indexHtmlPath)
    } catch (err) {
        indexHtmlPath = path.join(__dirname, "../dist/index.html")
    }
    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join('dist', 'icons', 'png', '32x32.png'),
        //frame:false,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: false, // Keep security best practices
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Load the preload script
        }
    });
    win.loadFile(indexHtmlPath)
    //win.loadURL('http://localhost:5173');
}

Menu.setApplicationMenu(null);

init().then()

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.handle('open-dev-tools', () => {
    if (win) {
        win.webContents.openDevTools()
    }
})

ipcMain.handle('maximize', () => {
    if (win) {
        win.maximize()
    }
})
ipcMain.handle('restore', () => {
    if (win) {
        win.restore()
    }
})
ipcMain.handle('minimize', () => {
    if (win) {
        win.minimize()
    }
})
ipcMain.handle('close-app', () => app.quit())

// Handle the file-saving request
ipcMain.handle('save-binary-file', async (_, fileName, fileData) => {
    try {
        const filePath = path.join(folderPath, 'data', fileName);
        await fs.promises.writeFile(filePath, Buffer.from(fileData), 'binary');
        return {success: true, data: filePath}
    } catch (err: unknown) {
        console.error(err)
        return {success: false, err}
    }
});

// Handle the file-loading request
ipcMain.handle('load-binary-file', async (_, fileName) => {
    try {
        const data = await fs.promises.readFile(path.join(folderPath, 'data', fileName));
        return {success: true, data : new Uint8Array(data)}
    } catch (err: unknown) {
        console.error(err);
        return {success: false, err}
    }
});

ipcMain.handle('delete-binary-file', async (_, fileName) => {
    try {
        await fs.promises.unlink(path.join(folderPath, 'data', fileName));
        return {success: true, data: fileName}
    } catch (err: unknown) {
        console.error(err);
        return {success: false, err}
    }
});