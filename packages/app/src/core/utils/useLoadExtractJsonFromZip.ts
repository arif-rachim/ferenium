import {ChangeEvent, LegacyRef, useEffect, useRef} from "react";
import JSZip from "jszip";
import {useAppContext} from "../hooks/useAppContext.ts";
import {Application} from "../../app/designer/AppDesigner.tsx";
import {createLogger} from "./logger.ts";

const log = createLogger("useLoadExtractJsonFromZip")
export function useLoadExtractJsonFromZip() {
    const ref = useRef<HTMLInputElement>();
    const {applicationSignal} = useAppContext();
    useEffect(() => {
        const inputElement = ref.current;

        async function onChangeListener(evt: Event) {
            const event = evt as unknown as ChangeEvent<HTMLInputElement>;
            const fileInput = event.target as HTMLInputElement;
            if (fileInput.files === null || fileInput.files.length === 0) {
                return;
            }
            const file = fileInput.files[0];
            const extension = file && file.name && file.name.split('.').pop()?.toLowerCase()
            const isUnzipped = extension === 'json';
            let jsonData: Application | undefined = undefined;
            if (isUnzipped) {
                const jsonString = await readFileAsString(file);
                jsonData = JSON.parse(jsonString);
            } else {
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(file);
                const jsonFile = zipContent.file('meta-inf.json');

                if (!jsonFile) {
                    throw new Error("JSON file not found in the ZIP archive");
                }
                const jsonString = await jsonFile.async('string');
                jsonData = JSON.parse(jsonString);
            }
            if (!jsonData) {
                return;
            }
            try {
                applicationSignal.set(jsonData);
            } catch (error) {
                log.error('Failed to extract JSON from ZIP:', error);
            }
        }

        if (inputElement) {
            inputElement.addEventListener('change', onChangeListener);
        }
        return () => {
            if (inputElement) {
                inputElement.removeEventListener('change', onChangeListener);
            }
        }
    }, [applicationSignal]);

    return {ref: ref as LegacyRef<HTMLInputElement> | undefined}
}

function readFileAsString(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string); // The file content as a string
        reader.onerror = reject;
        reader.readAsText(file);
    });
}