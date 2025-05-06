import {app, BrowserWindow, dialog, ipcMain, Menu, session} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import MessageBoxOptions = Electron.MessageBoxOptions;

let win: BrowserWindow | null;
const publicPath = path.join(os.homedir(), '..', 'Public', 'AppData', 'esnaadm-v2'); // Saves to Desktop
const appMeta = path.join(publicPath, 'data', 'app-meta.json');
const appIndex = path.join(publicPath, 'app', 'index.html');
const appEnv = path.join(publicPath, 'data', 'env.json');
const gotTheLock = app.requestSingleInstanceLock();

async function getEnvValue(parentWindow: BrowserWindow) {
    const envIsEmpty = !fs.existsSync(appEnv);
    let env = {baseUrl: ''};
    if (!envIsEmpty) {
        const envString = await fs.promises.readFile(appEnv, 'utf8')
        env = JSON.parse(envString);
    }
    if (env.baseUrl.trim() === '') {
        const url = await new Promise<string>(resolve => {
            const inputWin = new BrowserWindow({
                width: 460,
                height: 170,
                modal: true,
                parent: parentWindow,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,

                }
            })
            inputWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(autoUpdateUrlHTML)}`);
            ipcMain.once('auto-update-url', (event, url) => {
                resolve(url);
                inputWin.close();
            })
        })
        if (url && url.startsWith('http')) {
            env.baseUrl = url;
            await fs.promises.mkdir(path.dirname(appEnv), {recursive: true});
            await fs.promises.writeFile(appEnv, JSON.stringify(env), 'utf8')
        }
    }
    return env;
}

async function getRemoteMeta(env: { baseUrl: string }) {
    if (env.baseUrl) {
        try {
            const response = await fetch(`${env.baseUrl}/data/app-meta.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.error(err);
        }
    }
}

if (!gotTheLock) {
    app.quit();
}

async function setup() {
    await app.whenReady();
    await initEnvironment();
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
    // here we are copying the application
    const installedAppIsEmpty = !fs.existsSync(appIndex);
    const installedMetaIsEmpty = !fs.existsSync(appMeta);

    const bundledAppStat = await fs.promises.stat(path.join(__dirname, 'index.html'));
    const installedAppStat = !installedAppIsEmpty ? await fs.promises.stat(path.join(publicPath, 'app', 'index.html')) : undefined;

    const env = await getEnvValue(win);
    const remoteMetaJson = await getRemoteMeta(env);

    const bundledMeta = await fs.promises.readFile(path.join(__dirname, 'data', 'app-meta.json'), {encoding: 'utf8'});
    const bundledMetaJson = JSON.parse(bundledMeta);

    const installedMeta = !installedMetaIsEmpty ? await fs.promises.readFile(appMeta, {encoding: 'utf8'}) : undefined;
    const installedMetaJson = installedMeta ? JSON.parse(installedMeta) : undefined;

    const installedAppIsOld = installedAppStat && installedAppStat.mtime < bundledAppStat.mtime;
    const installedMetaIsOlderThanBundled = installedMetaJson && installedMetaJson.version < bundledMetaJson.version;
    const installedMetaIsOlderThanRemote = remoteMetaJson && installedMetaJson && installedMetaJson.version < remoteMetaJson.version;
    const installedBundledIsOlderThanRemote = remoteMetaJson && bundledMetaJson.version < remoteMetaJson.version;


    if (installedAppIsEmpty) {
        await copyFolderRecursive(__dirname, path.join(publicPath, 'app'), ['data'], ['main.cjs', 'preload.js']);
    } else if (installedAppIsOld) {
        const result = await dialog.showMessageBox(win, {
            type: 'question',
            buttons: ['Yes', 'No'],
            defaultId: 0,
            cancelId: 1,
            title: 'Update verification system',
            message: `Would you like to update the application base with the latest version from the installer ?\nThe latest version is updated on ${format_ddMMMyyyy(bundledAppStat.mtime)}, while the current version is updated on ${format_ddMMMyyyy(installedAppStat?.mtime)}.`
        })
        if (result.response === 0) {
            await copyFolderRecursive(__dirname, path.join(publicPath, 'app'), ['data'], ['main.cjs', 'preload.js']);
        }
    }
    // here we are copying the app-meta
    if (installedMetaIsEmpty) {
        if (installedBundledIsOlderThanRemote) {
            await fs.promises.mkdir(path.dirname(appMeta), {recursive: true});
            await fs.promises.writeFile(appMeta, JSON.stringify(remoteMetaJson), 'utf8');
        } else {
            await copyFolderRecursive(path.join(__dirname, 'data'), path.join(publicPath, 'data'), [], []);
        }
    } else if (installedMetaIsOlderThanBundled || installedMetaIsOlderThanRemote) {
        if (installedMetaIsOlderThanRemote) {
            const result = await dialog.showMessageBox(win, createMessageBox({
                location: 'autoupdate server',
                version: remoteMetaJson?.version,
                lastUpdate: remoteMetaJson?.lastUpdate,
                currentVersion: installedMetaJson?.version,
                currentLastUpdate: installedMetaJson?.lastUpdate
            }))
            if (result.response === 0) {
                await fs.promises.mkdir(path.dirname(appMeta), {recursive: true});
                await fs.promises.writeFile(appMeta, JSON.stringify(remoteMetaJson), 'utf8');
            }
        } else {
            const result = await dialog.showMessageBox(win, createMessageBox({
                location: 'installer',
                version: bundledMetaJson.version,
                lastUpdate: bundledMetaJson.lastUpdate,
                currentVersion: installedMetaJson?.version,
                currentLastUpdate: installedMetaJson?.lastUpdate
            }))
            if (result.response === 0) {
                await copyFolderRecursive(path.join(__dirname, 'data'), path.join(publicPath, 'data'), [], []);
            }
        }

    }
    // here we are creating log folder
    await fs.promises.mkdir(path.join(publicPath, 'log'), {recursive: true});
    await win.loadFile(appIndex)
}

Menu.setApplicationMenu(null);

setup().then();

function initEnvironment() {

    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) {
                win.restore();
            }
            win.focus();
        }
    })

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
            await fs.promises.mkdir(path.dirname(filePath), {recursive: true});
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
}

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

const maxSize = 5 * 1024 * 1024;

ipcMain.handle('log', async (_, level: 'info' | 'warn' | 'error' | 'debug', name: string, messages: string[]) => {
    const time = format_ddMMMyyyyHhMmSs(new Date())
    try {
        const fileName = name + '.txt';
        const logMessage = [`[${time}]`, level.padStart(5, ' ').toUpperCase(), ...messages, '\n'].join(' ');
        const logFile = path.join(publicPath, 'log', fileName);
        if (!fs.existsSync(logFile)) {
            await fs.promises.writeFile(logFile, '', {encoding: 'utf8'})
        }
        await logRotation({name, logMessage})
    } catch (err: unknown) {
        console.error(err);
        return {success: false, err}
    }
});

async function logRotation(params: { logMessage: string, name: string }) {
    const {logMessage, name} = params;
    const logFile = path.join(publicPath, 'log', name + '.txt');
    await fs.promises.appendFile(logFile, logMessage, {encoding: 'utf8'});
    if (fs.statSync(logFile).size > maxSize) {
        const archive = path.join(publicPath, 'log', name + `-${Date.now()}-` + '.txt');
        fs.renameSync(logFile, archive);
    }
}


export function format_ddMMMyyyy(date?: Date | string): string {
    const formattedDate = toDate(date);
    return formattedDate ? formatDate(formattedDate) : '';
}

export function format_ddMMMyyyyHhMmSs(date?: Date | string): string {
    const formattedDate = toDate(date);
    return formattedDate ? `${formatDate(formattedDate)} ${formatTime(formattedDate)}` : '';
}

const monthsAbbreviated = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatDate(date: Date): string {
    const day = pad(date.getDate());
    const monthAbbrev = monthsAbbreviated[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${monthAbbrev}-${year}`;
}

function formatTime(date: Date): string {
    const hr = pad(date.getHours());
    const mm = pad(date.getMinutes())
    const ss = pad(date.getSeconds());
    return `${hr}:${mm}:${ss}`;
}

const pad = (d: number): string => {
    const a = Math.abs(d);
    return a <= 9 ? `0${a}` : `${a}`
};


export function toDate(date?: unknown): Date | undefined {
    if (date === null || date === undefined || date === '') {
        return undefined;
    }
    if (date instanceof Date) {
        return date
    }
    try {
        if (typeof date === 'string') {
            const dateString = date.toUpperCase();
            if (isDdMmmYyyy(dateString)) {
                const [dayString, monthString, yearAndTime] = dateString.split('-')
                const day = parseInt(dayString);
                const month = monthsAbbreviated.indexOf(monthString);
                const year = yearAndTime.length >= '1970'.length ? parseInt(yearAndTime.substring(0, 4)) : 0;
                const hours = yearAndTime.length >= '1970 11'.length ? parseInt(yearAndTime.substring(5, 7)) : 0;
                const minutes = yearAndTime.length >= '1970 11:30'.length ? parseInt(yearAndTime.substring(8, 10)) : 0;
                const seconds = yearAndTime.length >= '1970 11:30:00'.length ? parseInt(yearAndTime.substring(11, 13)) : 0;
                return new Date(year, month, day, hours, minutes, seconds);
            } else {
                const year = dateString.length >= '1970'.length ? parseInt(dateString.substring(0, 4)) : 0;
                const month = dateString.length >= '1970-01'.length ? parseInt(dateString.substring(5, 7)) - 1 : 0;
                const day = dateString.length >= '1970-01-01'.length ? parseInt(dateString.substring(8, 10)) : 0;
                const hours = dateString.length >= '1970-01-01T10'.length ? parseInt(dateString.substring(11, 13)) : 0;
                const minutes = dateString.length >= '1970-01-01T10:10'.length ? parseInt(dateString.substring(14, 16)) : 0;
                const seconds = dateString.length >= '1970-01-01T10:10:11'.length ? parseInt(dateString.substring(17, 19)) : 0;
                return new Date(year, month, day, hours, minutes, seconds);
            }
        }
    } catch (err) {
        console.error(err);
    }
}


function isDdMmmYyyy(value: string) {
    for (const month of monthsAbbreviated) {
        if (value.indexOf(month) > 0) {
            return true;
        }
    }
    return false;
}

function createMessageBox(props: {
    location: string,
    version: string,
    lastUpdate: Date,
    currentVersion: string,
    currentLastUpdate: Date
}) {
    const messageBoxOptions: MessageBoxOptions = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 0,
        cancelId: 1,
        title: 'Update verification system',
        message: `Would you like to update the application metadata with the latest version from the ${props.location} ?\nThe latest version is ${props?.version} created on ${format_ddMMMyyyy(props.lastUpdate)}, while the current version is ${props?.currentVersion} created on ${format_ddMMMyyyy(props?.currentLastUpdate)}.`
    }
    return messageBoxOptions;
}

const autoUpdateUrlHTML = `
<!DOCTYPE html>
<html lang="en">
<body>
    <style>
        body{
            font-family : -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Helvetica Neue", sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color : #333;
            display: flex;
            flex-direction: column;
            padding : 10px
        }
        input {
            padding : 5px;
        }
        h3 {
            margin : 0;
        }
        input {
            border : 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            border : 1px solid #ddd;
            border-radius: 5px;
        }
    </style>
    <h3>Enter AutoUpdate URL:</h3>
    <div style="font-size: small;display: flex">The autoupdate URL is like the home of the app in the network. Its where the app goes to check if theres a new version. An example of this is : http://esnaad.jac.mil.ae/esnaadm </div>
    <form id="form" style="display: flex;gap:5px;margin-top: 10px">
        <input type="text" id="autoUpdateUrl" placeholder="http://swc-0481:8080" style="flex-grow: 1" required/>
        <button type="submit">Update</button>
    </form>
    <script type="text/javascript">
        const {ipcRenderer} = window.require('electron');
        document.getElementById('form').addEventListener('submit', (event) => {
            event.preventDefault();
            const url = document.getElementById('autoUpdateUrl').value;
            ipcRenderer.send('auto-update-url', url);
        })
    </script>
</body>
</html>
`