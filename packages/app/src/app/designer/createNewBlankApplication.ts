import {Application} from "./AppDesigner.tsx";
import {guid} from "../../core/utils/guid.ts";
import {createNewBlankPage} from "./createNewBlankPage.ts";

export function createNewBlankApplication(): Application {
    return {
        id: guid(),
        version: 0,
        lastUpdate: '',
        name: '',
        pages: [createNewBlankPage({name: 'home'})],
        callables: [],
        variables: [],
        fetchers: [],
        queries: [],
        databases: []
    }
}