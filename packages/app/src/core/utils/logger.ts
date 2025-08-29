import {useMemo} from "react";


export function createLogger(name: string, printConsole?: boolean) {
    function log(level: 'debug' | 'info' | 'warn' | 'error', ...messages: unknown[]) {
        if ('electronAPI' in window &&
            window.electronAPI && typeof window.electronAPI === 'object' &&
            'log' in window.electronAPI && window.electronAPI.log &&
            typeof window.electronAPI.log === 'function') {
            messages = messages.map(m => {
                if (typeof m === 'number') {
                    return m.toString();
                } else if (m instanceof Error) {
                    return m.stack ?? m.name;
                } else if (typeof m === 'string') {
                    return m;
                } else {
                    return JSON.stringify(m, null, 2);
                }
            }).filter(m => m && m.trim().length > 0);
            window.electronAPI.log(level, name, ...messages);
        }
        if (printConsole === false) {
            return;
        }
        const time = new Date().toLocaleTimeString()
        const logMessage = [`[${time}]`, ...messages].join(' ');
        const lvl = console[level] as (...params: unknown[]) => void;
        lvl(logMessage)

    }

    return {
        debug: (...messages: unknown[]): void => {
            log('debug', ...messages);
        },
        info: (...messages: unknown[]): void => {
            log('info', ...messages);
        },
        warn: (...messages: unknown[]): void => {
            log('warn', ...messages);
        },
        error: (...messages: unknown[]): void => {
            log('error', ...messages);
        }
    }
}

export function useLogger(name: string) {
    return useMemo(() => createLogger(name), [name])
}

export function wrapWithLog(code: string) {
    return `const _l = utils.createLogger;
utils = {...utils};utils.createLogger = (name) => {const _lg = _l(name,false);
return ['debug', 'info', 'warn', 'error'].reduce((res,key) => {const time = new Date().toLocaleTimeString();
res[key] = (...args) => {_lg[key](...args);console[key]('['+time+']',...args)};return res;},{});}   
try{
// source-code-start
${code}
// source-code-end
}catch(err){console.error(err)}`
}