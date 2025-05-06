import {Variable} from "../AppDesigner.tsx";
import {Signal} from "signal-polyfill";
import {undefined} from "zod";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {utils} from "../../../core/utils/utils.ts";
import {dbSchemaInitialization} from "./dbSchemaInitialization.ts";
import {createLogger, wrapWithLog} from "../../../core/utils/logger.ts";

const db = dbSchemaInitialization();
const log = createLogger('signal-compute-error');
export const initiateComputed = (app: FormulaDependencyParameter, page: FormulaDependencyParameter) => (v: Variable) => {

    const params = ['module', 'app', 'page', 'utils', 'db', wrapWithLog(v.functionCode)];
    try {
        const init = new Function(...params);
        const computed = new Signal.Computed(() => {
            const module: { exports: unknown } = {exports: undefined};
            const instances = [module, app, page, utils, db]
            try {
                init.call(null, ...instances);
            } catch (err) {
                log.error(v.name,err,v.functionCode);
            }
            return module.exports;
        });
        return {id: v.id, instance: computed};
    } catch (err) {
        log.error(v.name,err,v.functionCode);
    }
    return {
        id: v.id,
        instance: new Signal.Computed(() => {
        })
    }
}