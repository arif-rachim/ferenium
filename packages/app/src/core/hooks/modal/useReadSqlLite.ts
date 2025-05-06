import sqlite from "../../../app/designer/panels/database/sqlite.ts";

export function useReadSqlLite() {
    return async function readSqlLite(fileName:string) {
        const result = await sqlite({type: 'loadFromFile',fileName});
        return (result.value as Uint8Array<ArrayBuffer>).buffer as ArrayBuffer;
    }
}
