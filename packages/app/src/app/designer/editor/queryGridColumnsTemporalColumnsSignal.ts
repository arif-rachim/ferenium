import {Container} from "../AppDesigner.tsx";
import {Signal} from "signal-polyfill";

export const queryGridColumnsTemporalColumnsSignal: Signal.State<Record<Container['id'], string[]>> = new Signal.State({});
