/**
 * Generates a random GUID (Globally Unique Identifier).
 * @returns {string} A randomly generated GUID.
 */
export function guid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
let counter = 0;
export function uniqueNumber(): number {
    const timeStamp = Date.now();
    const uniquePart = (counter++ % 1000).toString().padStart(3,'0');
    const baseNumber = (timeStamp % 1.e7).toString();
    return parseInt(baseNumber + uniquePart,10);
}