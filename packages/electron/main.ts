import {app, BrowserWindow, ipcMain, Menu, session} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

let win: BrowserWindow | null;
const publicPath = path.join(os.homedir(), '..', 'Public', 'AppData', 'esnaadm-v2'); // Saves to Desktop
const appMeta = path.join(publicPath, 'data', 'app-meta.json');
const appIndex = path.join(publicPath, 'app', 'index.html');

async function init() {
    await app.whenReady();

    // here we are copying the application
    const indexHtmlIsEmpty = !fs.existsSync(appIndex)
    if (indexHtmlIsEmpty) {
        await copyFolderRecursive(__dirname, path.join(publicPath, 'app'), ['data'],['main.cjs','preload.js']);
    }
    // here we are copying the app-meta
    const targetMetaIsEmpty = !fs.existsSync(appMeta);
    if (targetMetaIsEmpty) {
        await copyFolderRecursive(path.join(__dirname,'data'), path.join(publicPath, 'data'), [],[]);
    }

    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join('dist', 'icons', 'png', '32x32.png'),
        webPreferences: {
            webSecurity: false,
            nodeIntegration: false, // Keep security best practices
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Load the preload script
        }
    });
    await win.loadFile(appIndex)
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
        const filePath = path.join(publicPath, 'data', fileName);
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
        const data = await fs.promises.readFile(path.join(publicPath, 'data', fileName));
        return {success: true, data: new Uint8Array(data)}
    } catch (err: unknown) {
        console.error(err);
        return {success: false, err}
    }
});

ipcMain.handle('delete-binary-file', async (_, fileName) => {
    try {
        await fs.promises.unlink(path.join(publicPath, 'data', fileName));
        return {success: true, data: fileName}
    } catch (err: unknown) {
        console.error(err);
        return {success: false, err}
    }
});


ipcMain.handle('fetch-request', async (event, url: string, options?: Record<string, unknown>) => {
    try {
        if (options && 'body' in options && options.body && typeof options.body === 'object' && options.isFormData === true) {
            const body = options.body as Record<string, {
                type: string,
                value: Uint8Array<ArrayBuffer> | string,
                name?: string
            }>;
            const formData = new FormData();
            Object.keys(body).forEach(key => {
                const {type, value} = body[key];
                if (type === 'file') {
                    const fileName = body[key].name;
                    formData.append(key, new Blob([value], {type: 'application/octet-stream'}), fileName);
                } else {
                    formData.append(key, value as string);
                }
            });
            options.body = formData;
        }
        const response = await session.defaultSession.fetch(url, options);
        if (!response.ok) {
            return {error: response.statusText}
        }
        const contentType = response.headers.get('Content-Type') ?? '';
        let type: 'blob' | 'json' | 'text' = 'text'
        if (contentType.toLowerCase().includes('application/json')) {
            type = 'json'
        }
        if (contentType.toLowerCase().includes('application/octet-stream')) {
            type = 'blob'
        }
        if (contentType.toLowerCase().includes('application/pdf')) {
            type = 'blob'
        }
        if (contentType.toLowerCase().includes('application/zip')) {
            type = 'blob'
        }
        if (type === 'blob') {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            return {data: arrayBuffer, contentType: contentType};
        }
        if (type === 'text') {
            const text = await response.text();
            return {data: text, contentType: contentType}
        }
        const json = await response.json();
        return {data: json, contentType: contentType}
    } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
            return {error: error.message as string}
        }
        return {error: 'Unable to fetch request'}
    }
});

async function copyFolderRecursive(source: string, destination: string, excludeFolders: string[], excludeFiles: string[]) {
    await fs.promises.mkdir(destination, {recursive: true});
    const entries = await fs.promises.readdir(source, {withFileTypes: true})
    for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);
        if (entry.isDirectory() && excludeFolders.includes(entry.name)) {
            continue;
        }
        if (entry.isFile() && excludeFiles.includes(entry.name)) {
            continue;
        }
        if (entry.isDirectory()) {
            await copyFolderRecursive(srcPath, destPath, excludeFolders, excludeFiles);
        } else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
}