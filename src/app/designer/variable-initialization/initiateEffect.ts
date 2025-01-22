import {Variable} from "../AppDesigner.tsx";
import {effect} from "react-hook-signal";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {ModalBox} from "./useModalBox.tsx";
import {utils} from "../../../core/utils/utils.ts";
import {createLogger} from "../../../core/utils/logger.ts";

const db = dbSchemaInitialization()

export function initiateEffect(props: {
    navigate: (path: string, param?: unknown) => Promise<void>,
    variables: Array<Variable>,
    app: FormulaDependencyParameter,
    page: FormulaDependencyParameter,
    alertBox: ModalBox,
    tools: { deleteSqlLite: () => Promise<void>, saveSqlLite: (buffer: ArrayBuffer) => Promise<void> },
}) {
    const {
        navigate,
        variables,
        app,
        page,
        alertBox,
        tools
    } = props;

    const destructorCallbacks: Array<() => void> = [];
    for (const v of variables) {
        if (v.type !== 'effect') {
            continue;
        }
        const log = createLogger(`${v.name}`);
        const params = ['navigate', 'db', 'app', 'page', 'alertBox', 'tools', 'utils', 'log', `${v.functionCode}`];
        try {
            const func = new Function(...params) as (...args: unknown[]) => void
            const destructor = effect(() => {
                const instances = [navigate, db, app, page, alertBox, tools, utils, log]
                try {
                    func.call(null, ...instances);
                } catch (err) {
                    log.error(err);
                }
            });
            destructorCallbacks.push(destructor);
        } catch (err) {
            log.error(err);
        }
    }
    return () => {
        destructorCallbacks.forEach(d => d());
    }
}