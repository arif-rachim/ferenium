export async function openDevTools() {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'openDevTools' in window.electronAPI && window.electronAPI.openDevTools && typeof window.electronAPI.openDevTools === 'function') {
        await window.electronAPI.openDevTools();
    }
}

export async function saveToFile(fileName: string, binaryArray: Uint8Array) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'saveToFile' in window.electronAPI && window.electronAPI.saveToFile && typeof window.electronAPI.saveToFile === 'function') {
        await window.electronAPI.saveToFile(fileName, binaryArray);
    }
}

export async function loadFromFile(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'loadFromFile' in window.electronAPI && window.electronAPI.loadFromFile && typeof window.electronAPI.loadFromFile === 'function') {
        const result =  await window.electronAPI.loadFromFile(fileName);
        if(result.success){
            return result.data as Uint8Array;
        }
    }
}

export async function deleteFile(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'deleteFile' in window.electronAPI && window.electronAPI.deleteFile && typeof window.electronAPI.deleteFile === 'function') {
        await window.electronAPI.deleteFile(fileName);
    }
}

export async function closeApp(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'closeApp' in window.electronAPI && window.electronAPI.closeApp && typeof window.electronAPI.closeApp === 'function') {
        await window.electronAPI.closeApp(fileName);
    }
}

export async function maximize(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'maximize' in window.electronAPI && window.electronAPI.maximize && typeof window.electronAPI.maximize === 'function') {
        await window.electronAPI.maximize(fileName);
    }
}

export async function minimize(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'minimize' in window.electronAPI && window.electronAPI.minimize && typeof window.electronAPI.minimize === 'function') {
        await window.electronAPI.minimize(fileName);
    }
}

export async function restore(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'restore' in window.electronAPI && window.electronAPI.restore && typeof window.electronAPI.restore === 'function') {
        await window.electronAPI.restore(fileName);
    }
}
