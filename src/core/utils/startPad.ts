export function startPad(input: string | number, length: number, char: string = '0'): string {
    const inputStr = input.toString();
    if (inputStr.length >= length) {
        return inputStr;
    }
    const padding = char.repeat(length - inputStr.length);
    return padding + inputStr;
}