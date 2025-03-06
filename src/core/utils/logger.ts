import {utils} from "./utils.ts";
import {useMemo} from "react";
const LEVEL = ["debug", "info", "warn", "error"] as const;
type LogLevel = typeof LEVEL[number];
const globalContext:{activeName?:string} = {activeName:undefined};

const enableGrouping = false;
const minimumLevel:LogLevel = 'error';

export function createLogger(name:string,initialLevel: LogLevel = 'debug') {

    let currentLevel = initialLevel;
    const currentName = name;
    const shouldLog = (level: LogLevel): boolean => {
        return LEVEL.indexOf(level) >= LEVEL.indexOf(currentLevel) && LEVEL.indexOf(minimumLevel) <= LEVEL.indexOf(currentLevel);
    }
    const setLevel = (level: LogLevel): void => {
        currentLevel = level;
    }

    const log = (level: LogLevel,...optionalParams:unknown[]): void => {
        if(shouldLog(level)){
            const timeStamp = utils.hhMmSs(new Date());
            const prefix = `(${timeStamp}) [${level}]`;
            if(enableGrouping && globalContext.activeName === undefined){
                globalContext.activeName = currentName;
                console.groupCollapsed(currentName);
            }else if (enableGrouping && globalContext.activeName !== currentName){
                globalContext.activeName = currentName;
                console.groupEnd();
                console.groupCollapsed(currentName);
            }
            console.info(`${prefix}`,...optionalParams);
        }
    }

    return {
        setLevel,
        debug: (...optionalParams:unknown[]): void => {
            log('debug',...optionalParams);
        },
        info: (...optionalParams:unknown[]): void => {
            log('info',...optionalParams);
        },
        warn: (...optionalParams:unknown[]): void => {
            log('warn',...optionalParams);
        },
        error: (...optionalParams:unknown[]): void => {
            log('error',...optionalParams);
        }
    }
}

export function useLogger(name:string){
    return useMemo(() => createLogger(name),[name])
}