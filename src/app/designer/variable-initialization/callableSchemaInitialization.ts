import {zodSchemaToJson} from "../../../core/utils/zodSchemaToJson.ts";
import {Callable} from "../AppDesigner.tsx";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {z} from "zod";
import {ModalBox} from "./useModalBox.tsx";
import {utils} from "../../../core/utils/utils.ts";

export function composeCallableSchema(allCallables: Array<Callable>) {
    const callableSchema = [];
    for (const callable of allCallables) {
        const code = `${callable.name} : (param:${zodSchemaToJson(callable.inputSchemaCode)}) => ${zodSchemaToJson(callable.schemaCode)}`;
        callableSchema.push(code);
    }
    return `{${callableSchema.join(',')}}`
}

export function callableInitialization(props: {
    allCallables: Array<Callable>,
    app: FormulaDependencyParameter,
    page: FormulaDependencyParameter,
    navigate: (path: string, param?: unknown) => Promise<void>,
    navigatePanel: (path: string, param?: unknown) => Promise<unknown>,
    closePanel: (payload?: unknown) => void,
    alertBox: ModalBox,
    tools: { deleteSqlLite: () => Promise<void>, saveSqlLite: (arrayBuffer: ArrayBuffer) => Promise<void> }
}) {
    const {allCallables, app, page, navigate, tools, alertBox, navigatePanel, closePanel} = props;

    const call: Record<string, (...args: unknown[]) => unknown> = {};
    for (const callable of allCallables) {
        const module: { exports: () => void } = {
            exports: () => {
            }
        };
        try {
            const fun = new Function('module', 'navigate', 'navigatePanel', 'closePanel', 'db', 'app', 'page', 'z', 'alertBox', 'tools', callable.functionCode);
            fun.call(null, module, navigate, navigatePanel, closePanel, dbSchemaInitialization(), app, page, z, alertBox, tools, utils)
            call[callable.name] = module.exports
        } catch (err) {
            console.error(err);
        }

    }
    return call
}
