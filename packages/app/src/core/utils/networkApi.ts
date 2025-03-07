export async function loadFromNetwork(fileName: string) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${fileName}`);
    if (!response.ok) {
        return undefined;
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}