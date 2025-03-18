import {Signal} from "signal-polyfill";

export type Info = {
    database: {
        type?: 'file' | 'opfs' | 'network',
        path?: string,

    },
    appMeta: {
        type?: 'file' | 'opfs' | 'network' | 'embed',
        path?: string,
        version?: number,
        lastUpdate?: string
    },
    appStorage: {
        type?: 'file' | 'opfs' | 'network' | 'embed',
        path?: string,
        version?: number,
        lastUpdate?: string
    }
}

export const infoSignal = new Signal.State<Info>({database: {}, appMeta: {}, appStorage: {}})
