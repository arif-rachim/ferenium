import {
    dateAdd,
    dateToString,
    format_ddMMM,
    format_ddMMMyyyy,
    format_ddMMMyyyy_hhmm,
    format_hhmm,
    format_hhmmss,
    toDate
} from "./dateFormat.ts";
import {toString} from "./toString.ts";
import {toNumber} from "./toNumber.ts";
import {isEmpty} from "./isEmpty.ts";
import {guid, uniqueNumber} from "./guid.ts";
import {startPad} from "./startPad.ts";
import {toBoolean} from "./toBoolean.ts";
import {arrayToQueryResult} from "./arrayToQueryResult.ts";
import {appStorage, clear} from "./appStorage.ts";
import {fetcher} from "./fetcher.ts";
import {encryptObject} from "./encryptObject.ts";
import {createLogger} from "./logger.ts";
import {toDefault} from "./toDefault.ts";
import {Signal} from "signal-polyfill";

const storage = appStorage();

export const utils = {
    toDate: toDate,
    dateToString: dateToString,
    dateAdd: dateAdd,
    ddMmmYyyy: format_ddMMMyyyy,
    hhMm: format_hhmm,
    ddMmm: format_ddMMM,
    hhMmSs: format_hhmmss,
    ddMmmYyyyHhMm: format_ddMMMyyyy_hhmm,
    toString: toString,
    toNumber: toNumber,
    isEmpty: isEmpty,
    guid: guid,
    uniqueNumber: uniqueNumber,
    startPad: startPad,
    toBoolean: toBoolean,
    arrayToQueryResult: arrayToQueryResult,
    setItem: storage.setItem,
    getItem: storage.getItem,
    removeItem: storage.removeItem,
    clearStorage: clear,
    fetch: fetcher,
    encryptObject: encryptObject,
    createLogger: createLogger,
    toDefault:toDefault,
    untrack : Signal.subtle.untrack
}