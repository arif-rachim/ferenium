import {utils} from "./utils.ts";

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
    let currentName = name;
    const shouldLog = (level: LogLevel): boolean => {
        return levels[level] >= levels[currentLevel];
    }
    const setLevel = (level: LogLevel): void => {
        currentLevel = level;
    }

    const log = (level: LogLevel,...optionalParams:any[]): void => {
        if(shouldLog(level)){
            const timeStamp = utils.hhMmSs(new Date());
            const prefix = `(${timeStamp}) [${level}]`;
            if(globalContext.activeName === undefined){
                globalContext.activeName = currentName;
                console.group(currentName);
            }else if (globalContext.activeName !== currentName){
                globalContext.activeName = currentName;
                console.groupEnd();
                console.group(currentName);
            }
            console.info(`${prefix}`,...optionalParams);
        }
    }

    return {
        setLevel,
        debug: (...optionalParams:any[]): void => {
            log('debug',...optionalParams);
        },
        info: (...optionalParams:any[]): void => {
            log('info',...optionalParams);
        },
        warn: (...optionalParams:any[]): void => {
            log('warn',...optionalParams);
        },
        error: (...optionalParams:any[]): void => {
            log('error',...optionalParams);
        }
    }
}