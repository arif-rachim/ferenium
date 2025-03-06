import {deleteFile, loadFromFile, saveToFile} from "./electronApi.ts";

const FILE = 'app-storage.json';
const FILE_META = 'app-meta.json';
let config: Record<string, unknown> = {};

export async function getAppMeta(){
    const cnf = await loadConfig();
    if(cnf){
        config = cnf;
    }
    return await loadApp() as Record<string, unknown>
}

export async function saveAppMeta(meta:Record<string, unknown>){
    await saveToFile(FILE_META, encodeFromString(JSON.stringify(meta)));
}

export async function setItem(key: string, value: string | number | null | Record<string, unknown>) {
    config[key] = value;
    await saveConfig(config);
    if (value && typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value))
    } else {
        localStorage.setItem(key, JSON.stringify({value: value,__type:typeof value}))
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
        if ('__type' in record) {
            return record.value as T;
        }
        return record as T;
    }
    return undefined;
}

function decodeToString(uint8Array: Uint8Array) {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(uint8Array);
}

function encodeFromString(str: string) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

async function loadConfig() {
    const buffer = await loadFromFile(FILE);
    if (buffer) {
        const config = JSON.parse(decodeToString(buffer));
        return config as Record<string, unknown>
    }
    return undefined;
}

async function loadApp() {
    const buffer = await loadFromFile(FILE_META);

    if (buffer) {
        const meta = JSON.parse(decodeToString(buffer));
        return meta as Record<string, unknown>
    }
    return undefined;
}

async function saveConfig(config: Record<string, unknown>) {
    await saveToFile(FILE, encodeFromString(JSON.stringify(config)));
}
