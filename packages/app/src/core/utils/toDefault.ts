export function toDefault<T>(val: unknown, defVal: T): T {
    if (val === undefined || val === null) {
        return defVal;
    }
    if(defVal === undefined || defVal === null) {
        return val as T;
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
