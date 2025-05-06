export function toDefault<T>(val: unknown, defVal: T): T {
    // first check if the val is undefined or null then return defaultVal
    if (val === undefined || val === null) {
        return defVal;
    }
    const typeVal = typeof val;
    const typeDefaultVal = typeof defVal;
    if(defVal && typeVal && typeof val === 'object' && typeof defVal === 'object') {
        if('constructor' in defVal && 'constructor' in val) {
            if(defVal.constructor === val.constructor) {
                return val as T;
            }
        }
    }
    if (typeVal === typeDefaultVal) {
        return val as T
    }
    return defVal;
}
