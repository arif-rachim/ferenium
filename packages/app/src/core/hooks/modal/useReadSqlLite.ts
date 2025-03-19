import sqlite from "../../../app/designer/panels/database/sqlite.ts";

export function useReadSqlLite() {
    return async function readSqlLite() {
        const result = await sqlite({type: 'loadFromFile'});
        return (result.value as Uint8Array).buffer as ArrayBuffer;
    }
}
