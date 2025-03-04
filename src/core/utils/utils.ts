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
import {clear, getItem, removeItem, setItem} from "./appStorage.ts";

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

    setItem: setItem,
    getItem: getItem,
    removeItem: removeItem,
    clearStorage: clear
}