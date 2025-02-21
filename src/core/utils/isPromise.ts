export function isPromise<T>(value: unknown): value is Promise<T> {
    return value !== null && typeof value === "object" && typeof value.then === "function" && typeof value.catch === "function";
}