/**
 * To check if a value is a number
 * @param val
 */
export function isNumber(val: unknown): val is number {
    return val !== undefined && val !== null && typeof val === 'number';
}