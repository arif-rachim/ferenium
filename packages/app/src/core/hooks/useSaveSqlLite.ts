import sqlite from "../../app/designer/panels/database/sqlite.ts";
import {useUpdateApplication} from "./useUpdateApplication.ts";

export function useSaveSqlLite() {
    const updateApp = useUpdateApplication();
    return async function saveSqlLite(fileName: string, data: ArrayBuffer) {
        if (fileName) {
            await sqlite({type: 'saveToFile', binaryArray: new Uint8Array(data), fileName})
            updateApp(original => {
                original.databases = original.databases ? [...original.databases] : [];
                if (!original.databases.includes(fileName)) {
                    original.databases.push(fileName);
                }
            })
        }
    }
}