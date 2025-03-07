import sqlite from "../../app/designer/panels/database/sqlite.ts";
import {getTables} from "../../app/designer/panels/database/getTables.ts";
import {useUpdateApplication} from "./useUpdateApplication.ts";
import {useModalBox} from "../../app/designer/variable-initialization/useModalBox.tsx";

export function useDeleteSqlLite() {
    const updateApplication = useUpdateApplication();
    const showModal = useModalBox();
    return async function deleteSqlLite() {
        const confirm = await showModal({title:"Delete confirmation",message:'Are you sure you want to delete the database ?',icon:'IoIosAlert',buttons:[{id:'Yes',label:'Yes',icon:"IoIosSchool"},{id:'No',label:'No',icon:'IoIosExit'}]});
        if(confirm === 'No'){
            return;
        }
        const result = await sqlite({type: 'deleteFromFile'});
        if (!result.errors) {
            const result = await getTables();
            updateApplication(old => {
                old.tables = result;
            });
        }
    }
}