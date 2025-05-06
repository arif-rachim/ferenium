import React from 'react'
import ReactDOM from 'react-dom/client'
import './core/style/index.css'
import "./editor/InitEditor.ts";
import CryptoJS from "crypto-js";
import {App} from "./App.tsx";
import {getAppMeta} from "./core/utils/appStorage.ts";
import {Application} from "./app/designer/AppDesigner.tsx";

window.CryptoJS = window.CryptoJS || CryptoJS;

async function init() {
    const meta = await getAppMeta() as Application;
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App meta={meta}/>
        </React.StrictMode>
    )
}

init().then()


