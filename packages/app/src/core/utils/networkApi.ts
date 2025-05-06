import {decodeToString} from "./appStorage.ts";
import {fetcher} from "./fetcher.ts";

export async function loadFromNetwork(fileName: string, isHtml?: boolean) {
    const URI = `${import.meta.env.BASE_URL}data/${fileName}`;
    const response = await fetcher(URI);
    if (response.error) {
        return;
    }
    if (response.data) {
        const buffer = response.data as ArrayBuffer;
        const uint8Array = new Uint8Array(buffer);
        const message = decodeToString(uint8Array);
        if (message.indexOf('<!doctype html>') >= 0) {
            return isHtml === true ? uint8Array : undefined;
        }
        return uint8Array;
    }
}

export async function loadFromNetworkLite(fileName: string) {
    const URI = `${import.meta.env.BASE_URL}data/${fileName}`;
    const response = await fetcher(URI);
    if (response.contentType === 'application/json') {
        const buffer = response.data;
        const encoder = new TextEncoder();
        return new Uint8Array(encoder.encode(JSON.stringify(buffer)));
    }
}