/**
 * Tools to check if a value is number or if its
 */
export function isNumberAble(val: unknown): boolean {
    if (val !== undefined && val !== null && typeof val === 'string') {
        return /^-?\d+(\.\d+)?$/.test(val);
    }
    return val !== undefined && val !== null && typeof val === 'number';
}