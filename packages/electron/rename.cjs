const fs = require('fs-extra');
const path = require('path');

const electronDir = path.join(__dirname, 'dist');
const mainJs = path.join(electronDir, 'main.js');
const appBuild = path.join(__dirname, '..', 'app', 'dist');

const targetDir = path.join(__dirname,'dist');
const targetMainJs = path.join(targetDir, 'main.cjs');

async function copyFolder() {
    await fs.copy(appBuild, targetDir, {recursive: true,overwrite:true});
    await fs.copy(mainJs, targetMainJs,{overwrite:true});
}

copyFolder().then()