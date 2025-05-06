import {Variable} from "../AppDesigner.tsx";
import {effect} from "react-hook-signal";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {ModalBox} from "./useModalBox.tsx";
import {utils} from "../../../core/utils/utils.ts";
import {createLogger, wrapWithLog} from "../../../core/utils/logger.ts";

const db = dbSchemaInitialization()

const log = createLogger('signal-effect-error');
export function initiateEffect(props: {
    navigate: (path: string, param?: Record<string, any>) => void,
    navigatePanel: (path: string, param?: Record<string, unknown>) => Promise<unknown>,
    closePanel: (param?: unknown) => void,
    variables: Array<Variable>,
    app: FormulaDependencyParameter,
    page: FormulaDependencyParameter,
    alertBox: ModalBox,
    tools: { deleteSqlLite: (fileName:string) => Promise<void>, saveSqlLite: (fileName:string,buffer: ArrayBuffer) => Promise<void>, readSqlLite : (fileName:string) => Promise<ArrayBuffer> },
}) {
    const {
        navigate,
        variables,
        app,
        page,
        alertBox,
        tools,
        navigatePanel,
        closePanel
    } = props;

    const destructorCallbacks: Array<() => void> = [];
    for (const v of variables) {
        if (v.type !== 'effect') {
            continue;
        }
        const params = ['navigate', 'navigatePanel', 'closePanel', 'db', 'app', 'page', 'alertBox', 'tools', 'utils', wrapWithLog(v.functionCode)];
        try {
            const func = new Function(...params) as (...args: unknown[]) => void;
            const destructor = effect(() => {
                const instances = [navigate, navigatePanel, closePanel, db, app, page, alertBox, tools, utils]
                try {
                    func.call(null, ...instances);
                } catch (err) {
                    log.error(v.name,err,v.functionCode);
                }
            });
            destructorCallbacks.push(destructor);
        } catch (err) {
            log.error(v.name,err,v.functionCode);
        }
    }
    return () => {
        destructorCallbacks.forEach(d => d());
    }
}
