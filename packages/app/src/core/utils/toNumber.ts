import {isNumberAble} from "./isNumberAble.ts";

export function toNumber(val: unknown, defaultVal?: number): number | undefined {
    if (val === undefined || val === null) {
        return defaultVal;
    }
    if (typeof val === 'number') {
        return val;
    }
    if (typeof val === 'string' && isNumberAble(val)) {
        let result = NaN;
        try {
            if (val.indexOf('.') > 0) {
                result = parseFloat(val);
            } else {
                result = parseInt(val);
            }
        } catch (err) {
        }
        if (isNaN(result)) {
            return defaultVal
        }
        return result;
    }
    return defaultVal;
}