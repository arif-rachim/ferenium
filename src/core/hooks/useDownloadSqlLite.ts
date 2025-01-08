import sqlite from "../../app/designer/panels/database/sqlite.ts";

export function useDownloadSqlLite() {
    return async function downloadSqlLite() {
        const result = await sqlite({type: 'loadFromFile'});
        const uint8Array = (result.value as Uint8Array);
        const blob = new Blob([uint8Array], {type: 'application/octet-stream'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'ferenium.db';
        link.click();
        URL.revokeObjectURL(url)
    }
}