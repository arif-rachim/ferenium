import JSZip from "jszip";

const unzip = true;
export const triggerDownloadZip = async (data: unknown) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const link = document.createElement('a');
    let blob: Blob | undefined = undefined;
    if (unzip) {
        blob = new Blob([jsonContent], {type: "text/plain"});
    } else {
        const zip = new JSZip();
        zip.file('meta-inf.json', jsonContent);
        blob = await zip.generateAsync({type: 'blob'});
    }
    link.href = URL.createObjectURL(blob);
    link.download = `app-meta.${unzip ? 'json' : 'zip'}`;

    // Trigger the download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
};