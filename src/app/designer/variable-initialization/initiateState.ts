import {Variable} from "../AppDesigner.tsx";
import {undefined} from "zod";
import {Signal} from "signal-polyfill";
import {utils} from "../../../core/utils/utils.ts";
import {createLogger} from "../../../core/utils/logger.ts";


export const initiateState = (variableInitialValue: Record<string, unknown>) => (v: Variable) => {
    const log = createLogger('initiateState');
    const module = {exports: {}};
    if (v.name in variableInitialValue && variableInitialValue[v.name] !== undefined && variableInitialValue[v.name] !== null) {
        module.exports = variableInitialValue[v.name] as unknown as typeof module.exports;
        const state = new Signal.State(module.exports);
        return {id: v.id, instance: state}
    } else {
        const params = ['module', 'utils', 'log', v.functionCode];
        try {
            const init = new Function(...params);
            init.call(null, module, utils, log);
            const state = new Signal.State(module.exports);
            return {id: v.id, instance: state}
        } catch (err) {
            log.error(err);
        }
    }
    return {
        instance: new Signal.State(undefined),
        id: v.id
    }
}