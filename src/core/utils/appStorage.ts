import {deleteFile, loadFromFile, saveToFile} from "./electronApi.ts";

const FILE = 'app-storage.json';

let config: Record<string, unknown> = {};
loadConfig().then(cnf => {
    if (cnf) {
        config = cnf;
    }
})

export async function setItem(key: string, value: string | number | null | Record<string, unknown>) {
    config[key] = value;
    await saveConfig(config);
    if (value && typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value))
    } else {
        localStorage.setItem(key, JSON.stringify({__value: value}))
    }
}

export async function removeItem(key: string) {
    if (config && key in config) {
        delete config[key];
        await saveConfig(config)
    }
    localStorage.removeItem(key)
}

export async function clear() {
    await deleteFile(FILE);
    localStorage.clear()
}

export function getItem<T>(key: string) {
    if (config && key in config) {
        return config[key] as T;
    }
    const val = localStorage.getItem(key);
    if (val) {
        const record = JSON.parse(val);
        if ('__value' in record) {
            return record.__value as T;
        }
        return record as T;
    }
    return undefined;
}

function arrayBufferToUtf8String(arrayBuffer: ArrayBuffer) {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(new Uint8Array(arrayBuffer));
}

function stringToUint8Array(str: string) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

async function loadConfig() {
    const buffer = await loadFromFile(FILE);
    if (buffer) {
        const config = JSON.parse(arrayBufferToUtf8String(buffer));
        return config as Record<string, unknown>
    }
    return undefined;
}

async function saveConfig(config: Record<string, unknown>) {
    await saveToFile(FILE, stringToUint8Array(JSON.stringify(config)));
}
