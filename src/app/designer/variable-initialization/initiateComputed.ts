import {Variable} from "../AppDesigner.tsx";
import {Signal} from "signal-polyfill";
import {undefined} from "zod";
import {FormulaDependencyParameter} from "./AppVariableInitialization.tsx";
import {utils} from "../../../core/utils/utils.ts";
import {createLogger} from "../../../core/utils/logger.ts";


export const initiateComputed = (app: FormulaDependencyParameter, page: FormulaDependencyParameter) => (v: Variable) => {

    const params = ['module', 'app', 'page', 'utils','log', v.functionCode];
    const log = createLogger('initiateComputed');
    try {
        const init = new Function(...params);
        const computed = new Signal.Computed(() => {
            const module: { exports: unknown } = {exports: undefined};
            const instances = [module, app, page, utils,log]
            try {
                init.call(null, ...instances);
            } catch (err) {
                log.error(err);
            }
            return module.exports;
        });
        return {id: v.id, instance: computed};
    } catch (err) {
        log.error(err);
    }
    return {
        id: v.id,
        instance: new Signal.Computed(() => {
        })
    }
}