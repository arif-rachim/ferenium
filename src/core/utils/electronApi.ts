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
        return await window.electronAPI.loadFromFile(fileName) as ArrayBuffer;
    }
}

export async function deleteFile(fileName: string) {
    if ('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'deleteFile' in window.electronAPI && window.electronAPI.deleteFile && typeof window.electronAPI.deleteFile === 'function') {
        await window.electronAPI.deleteFile(fileName);
    }
}
