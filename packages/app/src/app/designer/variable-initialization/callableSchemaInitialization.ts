import {zodSchemaToJson} from "../../../core/utils/zodSchemaToJson.ts";
import {Callable} from "../AppDesigner.tsx";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {z} from "zod";
import {ModalBox} from "./useModalBox.tsx";
import {utils} from "../../../core/utils/utils.ts";
import {createLogger, wrapWithLog} from "../../../core/utils/logger.ts";

export function composeCallableSchema(allCallables: Array<Callable>) {
    const callableSchema = [];
    for (const callable of allCallables) {
        const code = `${callable.name} : (param:${zodSchemaToJson(callable.inputSchemaCode)}) => ${zodSchemaToJson(callable.schemaCode)}`;
        callableSchema.push(code);
    }
    return `{${callableSchema.join(',')}}`
}

const log = createLogger('callable-error');

export function callableInitialization(props: {
    allCallables: Array<Callable>,
    app: FormulaDependencyParameter,
    page: FormulaDependencyParameter,
    navigate: (path: string, param?: Record<string, unknown>) => void,
    navigatePanel: (path: string, param?: Record<string, unknown>) => Promise<unknown>,
    alertBox: ModalBox,
    closePanel: (params?: unknown) => void,
    tools: {
        deleteSqlLite: (fileName:string) => Promise<void>,
        saveSqlLite: (fileName:string,arrayBuffer: ArrayBuffer) => Promise<void>,
        readSqlLite: (fileName:string) => Promise<ArrayBuffer>
    }
}) {
    const {allCallables, app, page, navigate, tools, alertBox, navigatePanel, closePanel} = props;

    const call: Record<string, (...args: unknown[]) => unknown> = {};
    for (const callable of allCallables) {
        const module: { exports: () => void } = {
            exports: () => {
            }
        };
        try {
            const fun = new Function('module', 'navigate', 'navigatePanel', 'closePanel', 'db', 'app', 'page', 'z', 'alertBox', 'tools', 'utils', wrapWithLog(callable.functionCode));
            fun.call(null, module, navigate, navigatePanel, closePanel, dbSchemaInitialization(), app, page, z, alertBox, tools, utils)
            call[callable.name] = module.exports
        } catch (err) {
            log.error(err, callable.functionCode);
        }
    }
    return call
}
