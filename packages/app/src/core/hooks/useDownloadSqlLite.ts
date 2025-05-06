import sqlite from "../../app/designer/panels/database/sqlite.ts";

export function useDownloadSqlLite() {
    return async function downloadSqlLite(fileName:string) {
        const result = await sqlite({type: 'loadFromFile',fileName});
        const uint8Array = (result.value as Uint8Array<ArrayBuffer>);
        const blob = new Blob([uint8Array], {type: 'application/octet-stream'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `${fileName}.db`;
        link.click();
        URL.revokeObjectURL(url)
    }
}