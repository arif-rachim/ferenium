export async function saveToOPFS(
    fileName: string,
    binaryArray: Uint8Array,
): Promise<{
    success: boolean
}> {
    const root = await navigator.storage.getDirectory();
    try {
        const fileHandle = await root.getFileHandle(fileName, {create: true});
        const writeableStream = await fileHandle.createWritable();
        await writeableStream.write(binaryArray);
        await writeableStream.close();
        return {success: true}
    } catch (err) {
        return {success: false}
    }

}

export async function loadFromOPFS(fileName: string): Promise<{ success: boolean, data?: Uint8Array }> {
    const root = await navigator.storage.getDirectory();
    try {
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        return {data: new Uint8Array(arrayBuffer), success: true};
    } catch (err) {
        return {success: false}
    }

}

export async function deleteOPFS(fileName: string): Promise<{ success: boolean }> {
    const root = await navigator.storage.getDirectory();
    try {
        await root.removeEntry(fileName, {recursive: true});
        return {success: true};
    } catch (err: unknown) {
        return {success: false};
    }

}