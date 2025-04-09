import {decodeToString} from "./appStorage.ts";
import {utils} from "./utils.ts";

export async function loadFromNetwork(fileName: string, isHtml?: boolean) {
    const URI = `${import.meta.env.BASE_URL}data/${fileName}`;
    const response = await utils.fetch(URI);
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