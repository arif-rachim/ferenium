export function toBoolean(val: unknown, defaultVal?: boolean): boolean | undefined {
    if (typeof val === 'boolean') {
        return val;
    }
    if (val === undefined || val === null) {
        return defaultVal;
    }
    if (typeof val === 'number') {
        return val === 1;
    }
    if (typeof val === 'string') {
        return val.toUpperCase() === 'TRUE'
    }
    return defaultVal;
}