import {Variable} from "../AppDesigner.tsx";
import {effect} from "react-hook-signal";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {ModalBox} from "./useModalBox.tsx";
import {utils} from "../../../core/utils/utils.ts";

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
        const params = ['navigate', 'navigatePanel', 'closePanel', 'db', 'app', 'page', 'alertBox', 'tools', 'utils', `${v.functionCode}`];
        try {
            const func = new Function(...params) as (...args: unknown[]) => void
            const destructor = effect(() => {
                const instances = [navigate, db, app, page, alertBox, tools, utils]
                try {
                    func.call(null, ...instances);
                } catch (err) {
                    console.group('There was a problem when running the Effect. Please check the error message below');
                    console.error(err);
                    console.log(v.functionCode);
                    console.groupEnd();
                }
            });
            destructorCallbacks.push(destructor);
        } catch (err) {
            console.group('There was a problem when initiating the Effect. Please check the error message below');
            console.error(err);
            console.log(v.functionCode);
            console.groupEnd();
        }
    }
    return () => {
        destructorCallbacks.forEach(d => d());
    }
}