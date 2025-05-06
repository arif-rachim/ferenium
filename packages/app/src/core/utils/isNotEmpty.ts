import {isEmpty} from "./isEmpty.ts";

/**
 * Checks if a value is NOT empty.
 * @param {unknown} value - The value to be checked.
 * @returns {boolean} true if the value is empty, otherwise false.
 */
export function isNotEmpty<T>(value:T):value is NonNullable<T> {
    return !isEmpty(value)
}