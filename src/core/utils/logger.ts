import {utils} from "./utils.ts";
import {useMemo} from "react";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const globalContext:{activeName?:string} = {activeName:undefined};

export function createLogger(name:string,initialLevel: LogLevel = 'debug') {
    const levels: Record<LogLevel, number> = {
        debug: 1,
        info: 2,
        warn: 3,
        error: 4
    };
    let currentLevel = initialLevel;
    const currentName = name;
    const shouldLog = (level: LogLevel): boolean => {
        return levels[level] >= levels[currentLevel];
    }
    const setLevel = (level: LogLevel): void => {
        currentLevel = level;
    }

    const log = (level: LogLevel,...optionalParams:unknown[]): void => {
        if(shouldLog(level)){
            const timeStamp = utils.hhMmSs(new Date());
            const prefix = `(${timeStamp}) [${level}]`;
            if(globalContext.activeName === undefined){
                globalContext.activeName = currentName;
                console.groupCollapsed(currentName);
            }else if (globalContext.activeName !== currentName){
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