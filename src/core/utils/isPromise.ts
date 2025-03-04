export function isPromise<T>(value: unknown): value is Promise<T> {
    return value !== null
        && typeof value === "object"
        && 'then' in value
        && typeof value.then === "function"
        && 'catch' in value
        && typeof value.catch === "function";
}