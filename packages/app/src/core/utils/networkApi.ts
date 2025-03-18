import {decodeToString} from "./appStorage.ts";

export async function loadFromNetwork(fileName: string,isHtml?:boolean) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${fileName}`);
    if (!response.ok) {
        return undefined;
    }
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const message = decodeToString(uint8Array);
    if(message.indexOf('<!doctype html>') >= 0) {
        return isHtml === true ? uint8Array : undefined;
    }
    return uint8Array;
}