import sqlite from "../../app/designer/panels/database/sqlite.ts";
import {useModalBox} from "../../app/designer/variable-initialization/useModalBox.tsx";
import {useUpdateApplication} from "./useUpdateApplication.ts";

export function useDeleteSqlLite() {
    const showModal = useModalBox();
    const updateApp = useUpdateApplication();
    return async function deleteSqlLite(fileName:string) {
        const confirm = await showModal({title:"Delete confirmation",message:`Are you sure you want to delete the ${fileName} ?`,icon:'IoIosAlert',buttons:[{id:'Yes',label:'Yes',icon:"IoIosSchool"},{id:'No',label:'No',icon:'IoIosExit'}]});
        if(confirm === 'No'){
            return;
        }
        await sqlite({type: 'deleteFromFile',fileName});
        updateApp(original => {
            original.databases = original.databases.filter(i => i !== fileName);
        })
    }
}