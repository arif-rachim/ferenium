import {ContainerPropertyType} from "../../app/designer/AppDesigner.tsx";
import {useUpdateApplication} from "./useUpdateApplication.ts";
import {useAppContext} from "./useAppContext.ts";


export function useNameRefactor() {
    const updateApplication = useUpdateApplication();
    const {activePageIdSignal} = useAppContext();
    return function refactorName(props: {
        currentName: string,
        newName: string,
        scope: 'app' | 'page',
        type: 'var' | 'fetch' | 'query' | 'call'
    }) {
        updateApplication(application => {
            const app = structuredClone(application);
            const codesToCheck: Array<{ functionCode: string, id: string, name: string }> = [];
            const propsToCheck: Array<Record<string, ContainerPropertyType>> = []
            if (props.scope === 'app') {
                codesToCheck.push(...app.variables);
                codesToCheck.push(...app.callables);
                codesToCheck.push(...app.fetchers);
            }

            app.pages.filter(p => {
                if (props.scope === 'page') {
                    return p.id === activePageIdSignal.get();
                }
                return true;
            }).forEach(p => {
                codesToCheck.push(...p.variables);
                codesToCheck.push(...p.callables);
                codesToCheck.push(...p.fetchers);
                p.containers.forEach(p => {
                    propsToCheck.push(p.properties)
                })
            });

            const matchingPattern = `${props.scope}.${props.type}.${props.currentName}`
            const newPattern = `${props.scope}.${props.type}.${props.newName}`

            codesToCheck.forEach(v => {
                if (v.functionCode.indexOf(matchingPattern) > -1) {
                    v.functionCode = v.functionCode.split(matchingPattern).join(newPattern)
                }
            })

            propsToCheck.forEach(v => {
                Object.keys(v).forEach(key => {
                    if ((v[key].formula ?? '').indexOf(matchingPattern) > -1) {
                        v[key].formula = (v[key].formula ?? '').split(matchingPattern).join(newPattern)
                    }
                })
            })

            application.pages = app.pages;
            application.callables = app.callables;
            application.variables = app.variables;
            application.fetchers = app.fetchers;
        })
    }
}
