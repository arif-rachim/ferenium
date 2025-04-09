import {deleteFile, loadFromFile, saveToFile} from "./electronApi.ts";
import {deleteOPFS, loadFromOPFS, saveToOPFS} from "./opfsApi.ts";
import {loadFromNetwork} from "./networkApi.ts";
import {infoSignal} from "./info.ts";
import {utils} from "./utils.ts";
import {createLogger} from "./logger.ts";

const FILE = 'app-storage.json';
const FILE_META = 'app-meta.json';
let config: Record<string, unknown> = {};
const log = createLogger("appStorage");
export async function getAppMeta() {
    const cnf = await loadConfig();
    config = cnf ?? config;
    return await loadApp() as Record<string, unknown>
}

export async function saveAppMeta(meta: Record<string, unknown>) {
    meta.version = meta.version && typeof meta.version === 'number' ? (meta.version + 1) : 1
    meta.lastUpdate = utils.dateToString(new Date());
    await saveToFile(FILE_META, encodeFromString(JSON.stringify(meta)));
    await saveToOPFS(FILE_META, encodeFromString(JSON.stringify(meta)));
}

export async function setItem(key: string, value: string | number | null | Record<string, unknown> | Array<unknown> | boolean) {
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

export async function deleteAppAndResetFactory() {
    await deleteFile(FILE);
    await deleteOPFS(FILE);
    await deleteFile(FILE_META);
    await deleteOPFS(FILE_META);
}

export function getItem<T>(key: string) {
    if (config && key in config) {
        return config[key] as T;
    }
    return undefined;
}

export function decodeToString(uint8Array: Uint8Array) {
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
        try{
            const config = JSON.parse(decodeToString(fileBuffer));
            const current = infoSignal.get()
            infoSignal.set({...current,appStorage:{type:'file',path:FILE,version:config.version,lastUpdate:config.lastUpdate}})
            return config as Record<string, unknown>
        }catch (err){
            log.error(err);
        }
    }
    const {data:oBuffer} = await loadFromOPFS(FILE);
    if (oBuffer) {
        try{
            const config = JSON.parse(decodeToString(oBuffer));
            const current = infoSignal.get()
            infoSignal.set({...current,appStorage:{type:'opfs',path:FILE,version:config.version,lastUpdate:config.lastUpdate}})
            return config as Record<string, unknown>
        }catch(err){
            log.error(err);
        }
    }

    const networkBuffer = await loadFromNetwork(FILE);
    if (networkBuffer) {
        try{
            const jsonString = decodeToString(networkBuffer);
            const config = JSON.parse(jsonString);
            const current = infoSignal.get()
            infoSignal.set({...current,appStorage:{type:'network',path:FILE,version:config.version,lastUpdate:config.lastUpdate}})
            return config as Record<string, unknown>
        }catch(err){

        }
    }

    return undefined;
}

async function loadApp() {
    const buffer = await loadFromFile(FILE_META);
    if (buffer) {
        const meta = JSON.parse(decodeToString(buffer));
        const current = infoSignal.get()
        infoSignal.set({...current,appMeta:{type:'file',path:FILE_META,version:meta.version,lastUpdate:meta.lastUpdate}})
        return meta as Record<string, unknown>
    }

    const {data} = await loadFromOPFS(FILE_META);
    if (data) {
        const meta = JSON.parse(decodeToString(data));
        const current = infoSignal.get()
        infoSignal.set({...current,appMeta:{type:'opfs',path:FILE_META,version:meta.version,lastUpdate:meta.lastUpdate}})
        return meta as Record<string, unknown>
    }
    const networkBuffer = await loadFromNetwork(FILE_META);
    if (networkBuffer && networkBuffer.length > 0) {
        const meta = JSON.parse(decodeToString(networkBuffer));
        const current = infoSignal.get()
        infoSignal.set({...current,appMeta:{type:'network',path:FILE_META,version:meta.version,lastUpdate:meta.lastUpdate}})
        return meta as Record<string, unknown>
    }
    return {};
}

async function saveConfig(config: Record<string, unknown>) {
    config.version = config.version && typeof config.version === 'number' ? (config.version + 1) : 1
    config.lastUpdate = utils.dateToString(new Date());
    await saveToFile(FILE, encodeFromString(JSON.stringify(config)));
    await saveToOPFS(FILE, encodeFromString(JSON.stringify(config)));
}
