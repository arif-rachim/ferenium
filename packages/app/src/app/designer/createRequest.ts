import {Fetcher, FetcherParameter} from "./AppDesigner.tsx";
import {isNotEmpty} from "../../core/utils/isNotEmpty.ts";

export type FetcherConfig = {
    mapRequest?: (props: { request: Record<string, unknown>, body?: Record<string, unknown> }) => { request: Record<string, unknown>, body?: Record<string, unknown> }
}

export function createRequest(fetcher: Fetcher, inputs: Record<string, unknown>, config?: FetcherConfig) {
    const url = `${fetcher.protocol}://${fetcher.domain}`;

    function populateTemplate(template: string, parameters: Record<string, string>) {
        return template.replace(/{(.*?)}/g, (match, p1) => {
            // remove any extra whitespace from the parameter name
            const paramName = p1.trim();
            // return the parameter value or the original placeholder
            return isNotEmpty(parameters[paramName]) ? parameters[paramName] : match
        })
    }

    function toRecord(encodeString: boolean, userInput: Record<string, unknown>) {
        return (result: Record<string, string>, parameter: FetcherParameter) => {
            const {name, isInput} = parameter;
            let value = parameter.value;
            try {
                value = JSON.parse(value);
            } catch (err) {
                // ignore this if this cannot be parsed
            }
            if (isInput && userInput[name]) {
                value = userInput[name] as string;
            }
            if (encodeString) {
                result[encodeURIComponent(parameter.name)] = encodeURIComponent(value)
            } else {
                result[parameter.name] = value
            }
            return result;
        }
    }

    const path = populateTemplate(fetcher.path, fetcher.paths.reduce(toRecord(true, inputs), {}));

    function trimSlashes(str: string) {
        return str.replace(/^\/+|\/+$/g, '')
    }

    const address = `${url}/${trimSlashes(path.trim())}`
    let requestInit: RequestInit = {
        method: fetcher.method,
        cache: 'no-cache',
        credentials: 'include',
        headers: fetcher.headers.reduce(toRecord(true, inputs), {
            'Content-Type': fetcher.contentType
        }),
    }

    function objectToUrlEncodedString(obj: Record<string, string>) {
        return Object.entries(obj).map(([key, value]) => `${key}=${value}`).join('&')
    }

    const hasContent = ['post', 'patch', 'put'].includes(fetcher.method);
    if (hasContent) {
        let body:Record<string, unknown> = {};
        let bodyString = '';
        if (fetcher.contentType === 'application/x-www-form-urlencoded') {
            body = fetcher.data.reduce(toRecord(true, inputs), {});
        }
        if (fetcher.contentType === 'application/json') {
            body = fetcher.data.reduce(toRecord(false, inputs), {});
        }
        if (config && config.mapRequest) {
            const params = config.mapRequest({request: requestInit as Record<string, unknown>, body: body});
            requestInit = params.request as RequestInit;
            body = params.body || {};
        }
        if (fetcher.contentType === 'application/x-www-form-urlencoded') {
            bodyString = objectToUrlEncodedString(body as Record<string, string>)
        }
        if (fetcher.contentType === 'application/json') {
            bodyString = JSON.stringify(body)
        }
        requestInit.body = bodyString;
    } else {
        if (config && config.mapRequest) {
            const params = config.mapRequest({request: requestInit as Record<string, unknown>});
            requestInit = params.request as RequestInit;
        }
    }

    return {address, requestInit};
}