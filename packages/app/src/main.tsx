import React from 'react'
import ReactDOM from 'react-dom/client'
import './core/style/index.css'
import "./editor/InitEditor.ts";
import CryptoJS from "crypto-js";
import {App} from "./App.tsx";
import {getAppMeta} from "./core/utils/appStorage.ts";
import {Application} from "./app/designer/AppDesigner.tsx";
import {getTables} from "./app/designer/panels/database/getTables.ts";

window.CryptoJS = window.CryptoJS || CryptoJS;

async function init() {
    const meta = await getAppMeta() as Application;
    meta.tables = await getTables();
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App meta={meta}/>
        </React.StrictMode>
    )
}

init().then()


