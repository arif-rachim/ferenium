import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('electronAPI', {
    saveToFile: (fileName: string, fileData: unknown) => ipcRenderer.invoke('save-binary-file', fileName, fileData),
    loadFromFile: (fileName: string) => ipcRenderer.invoke('load-binary-file', fileName),
    deleteFile: (fileName: string) => ipcRenderer.invoke('delete-binary-file', fileName),
    closeApp: () => ipcRenderer.invoke('close-app'),
    openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
    maximize: () => ipcRenderer.invoke('maximize'),
    minimize: () => ipcRenderer.invoke('minimize'),
    restore: () => ipcRenderer.invoke('restore'),
    fetch: (url: string, options: Record<string, unknown>, formData?: Record<string, unknown>) => ipcRenderer.invoke('fetch-request', url, options, formData),
    log: (level: 'info' | 'warn' | 'error' | 'debug', name: string, ...messages: unknown[]) => ipcRenderer.invoke('log', level, name, messages),
});