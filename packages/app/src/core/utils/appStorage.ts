import {deleteFile, loadFromFile, saveToFile} from "./electronApi.ts";
import {deleteOPFS, loadFromOPFSLite, saveToOPFS} from "./opfsApi.ts";
import {loadFromNetworkLite} from "./networkApi.ts";
import {infoSignal} from "./info.ts";
import {Application} from "../../app/designer/AppDesigner.tsx";
import {dateToString} from "./dateFormat.ts";

const FILE = 'app-storage.json';
const FILE_META = 'app-meta.json';

export function appStorage() {
    const state: {ready:boolean, config: Record<string, unknown> & { version?: number, lastUpdate?: string } } = {config: {},ready:false}
    loadConfig().then(cnf => {
        state.config = cnf ?? state.config;
        state.ready = true;
    }).catch(err => {
        console.error(err);
    })

    async function setItem(key: string, value: string | number | null | Record<string, unknown> | Array<unknown> | boolean) {
        if(!state.ready){
            throw new Error('App storage is not ready yet');
        }
        state.config[key] = value;
        await saveConfig(state.config);
    }

    async function removeItem(key: string) {
        if(!state.ready){
            throw new Error('App storage is not ready yet');
        }
        if (state.config && key in state.config) {
            delete state.config[key];
            await saveConfig(state.config)
        }
    }

    function getItem<T>(key: string) {
        if(!state.ready){
            throw new Error('App storage is not ready yet');
        }
        if (state.config && key in state.config) {
            return state.config[key] as T;
        }
        return undefined;
    }

    return {state, setItem, removeItem, getItem}
}

export async function getAppMeta() {
    return await loadApp() as Record<string, unknown>
}

export async function saveAppMeta(meta: Application) {
    meta.version = meta.version ? (meta.version + 1) : 1
    meta.lastUpdate = dateToString(new Date()) ?? '';
    await saveToFile(FILE_META, encodeFromString(JSON.stringify(meta)));
    await saveToOPFS(FILE_META, encodeFromString(JSON.stringify(meta)));
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

export function decodeToString(uint8Array: Uint8Array<ArrayBuffer>) {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(uint8Array);
}

function encodeFromString(str: string) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

async function loadConfig() {
    const configs = await getResource(FILE);
    const config = configs[0];
    const current = infoSignal.get();
    infoSignal.set({
        ...current,
        appStorage: {
            type: config.type,
            path: FILE,
            version: config.app?.version,
            lastUpdate: config.app?.lastUpdate
        }
    })
    return config.app;
}

async function getResource(fileName: string) {
    const response = await Promise.all([loadFromFile(fileName), loadFromOPFSLite(fileName), loadFromNetworkLite(fileName)]);
    const [file, opfs, http] = response.map(buffer => buffer ? JSON.parse(decodeToString(buffer)) : undefined) as Array<{
        version: number,
        lastUpdate: string
    }>;
    const resources: Array<{
        app?: { version: number, lastUpdate: string },
        type: 'file' | 'opfs' | 'http'
    }> = [{app: file, type: 'file'}, {app: opfs, type: 'opfs'}, {app: http, type: 'http'}];
    return resources.sort((a, b) => {
        const aSeq = a.app?.version;
        const bSeq = b.app?.version;
        if (aSeq !== undefined && bSeq !== undefined) {
            return bSeq - aSeq;
        }
        if (aSeq === undefined && bSeq !== undefined) {
            return 1
        }
        if (aSeq !== undefined && bSeq === undefined) {
            return -1
        }
        return 0;
    });
}

async function loadApp() {
    const apps = await getResource(FILE_META);
    const app = apps[0];
    const current = infoSignal.get();
    infoSignal.set({
        ...current,
        appMeta: {type: app.type, path: FILE_META, version: app.app?.version, lastUpdate: app.app?.lastUpdate}
    })
    return app.app;
}

async function saveConfig(config: Record<string, unknown> & { version?: number, lastUpdate?: string }) {
    config.version = config.version ? (config.version + 1) : 1
    config.lastUpdate = dateToString(new Date()) ?? '';
    await saveToFile(FILE, encodeFromString(JSON.stringify(config)));
    await saveToOPFS(FILE, encodeFromString(JSON.stringify(config)));
}
