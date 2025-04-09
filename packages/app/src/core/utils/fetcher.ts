const disableElectronApi = false;

export async function fetcher(url: string, options?: RequestInit): Promise<{
    error?: string,
    data?: unknown,
    contentType?: string
}> {
    if (!disableElectronApi && 'electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'fetch' in window.electronAPI && window.electronAPI.fetch && typeof window.electronAPI.fetch === 'function') {
        const opt = options as Record<string, unknown>;
        if (opt?.body instanceof FormData) {
            const formData = opt.body;
            const serializedFormData = {} as Record<string, unknown>;
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    const arrayBuffer = await value.arrayBuffer();
                    serializedFormData[key] = {
                        type: 'file',
                        value: new Uint8Array(arrayBuffer),
                        name: value.name
                    }
                } else {
                    serializedFormData[key] = {type: 'string', value};
                }
            }
            opt.isFormData = true;
            opt.body = serializedFormData;
        }
        return window.electronAPI.fetch(url, opt);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            return {error: response.statusText}
        }
        const contentType = response.headers.get('Content-Type') ?? '';
        let type: 'blob' | 'json' | 'text' = 'text'
        if (contentType.toLowerCase().includes('application/json')) {
            type = 'json'
        }
        if (contentType.toLowerCase().includes('application/octet-stream')) {
            type = 'blob'
        }
        if (contentType.toLowerCase().includes('application/pdf')) {
            type = 'blob'
        }
        if (contentType.toLowerCase().includes('application/zip')) {
            type = 'blob'
        }
        if (type === 'blob') {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            return {data: arrayBuffer, contentType: contentType};
        }
        if (type === 'text') {
            const text = await response.text();
            return {data: text, contentType: contentType}
        }
        const json = await response.json();
        return {data: json, contentType: contentType}
    } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
            return {error: error.message as string}
        }
        return {error: 'Unable to fetch request'}
    }
}
