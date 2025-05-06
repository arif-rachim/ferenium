import {Signal} from "signal-polyfill";

export type Info = {
    database: {
        type?: 'file' | 'opfs' | 'http',
        path?: string,

    },
    appMeta: {
        type?: 'file' | 'opfs' | 'http' ,
        path?: string,
        version?: number,
        lastUpdate?: string
    },
    appStorage: {
        type?: 'file' | 'opfs' | 'http' ,
        path?: string,
        version?: number,
        lastUpdate?: string
    }
}

export const infoSignal = new Signal.State<Info>({database: {}, appMeta: {}, appStorage: {}})
