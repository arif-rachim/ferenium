import {deleteFile, loadFromFile, saveToFile} from "./electronApi.ts";
import {deleteOPFS, loadFromOPFS, saveToOPFS} from "./opfsApi.ts";
import {loadFromNetwork} from "./networkApi.ts";

const FILE = 'app-storage.json';
const FILE_META = 'app-meta.json';
let config: Record<string, unknown> = {};

export async function getAppMeta() {
    const cnf = await loadConfig();
    config = cnf ?? config;
    return await loadApp() as Record<string, unknown>
}

export async function saveAppMeta(meta: Record<string, unknown>) {
    await saveToFile(FILE_META, encodeFromString(JSON.stringify(meta)));
    await saveToOPFS(FILE_META, encodeFromString(JSON.stringify(meta)));
}

export async function setItem(key: string, value: string | number | null | Record<string, unknown>) {
    config[key] = value;
    await saveConfig(config);
}

export async function removeItem(key: string) {
    if (config && key in config) {
        delete config[key];
        await saveConfig(config)
    }
}

export async function clear() {
    await deleteFile(FILE);
    await deleteOPFS(FILE);
}

export function getItem<T>(key: string) {
    if (config && key in config) {
        return config[key] as T;
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
    const fileBuffer = await loadFromFile(FILE);
    if (fileBuffer) {
        const config = JSON.parse(decodeToString(fileBuffer));
        return config as Record<string, unknown>
    }
    const {data:oBuffer} = await loadFromOPFS(FILE);
    if (oBuffer) {
        const meta = JSON.parse(decodeToString(oBuffer));
        return meta as Record<string, unknown>
    }
    const networkBuffer = await loadFromNetwork(FILE);
    if (networkBuffer) {
        const meta = JSON.parse(decodeToString(networkBuffer));
        return meta as Record<string, unknown>
    }
    return undefined;
}

async function loadApp() {
    const buffer = await loadFromFile(FILE_META);
    if (buffer) {
        const meta = JSON.parse(decodeToString(buffer));
        return meta as Record<string, unknown>
    }
    const {data} = await loadFromOPFS(FILE_META);
    if (data) {
        const meta = JSON.parse(decodeToString(data));
        return meta as Record<string, unknown>
    }
    const networkBuffer = await loadFromNetwork(FILE_META);
    if (networkBuffer) {
        const meta = JSON.parse(decodeToString(networkBuffer));
        return meta as Record<string, unknown>
    }
    return undefined;
}

async function saveConfig(config: Record<string, unknown>) {
    await saveToFile(FILE, encodeFromString(JSON.stringify(config)));
    await saveToOPFS(FILE, encodeFromString(JSON.stringify(config)));
}
