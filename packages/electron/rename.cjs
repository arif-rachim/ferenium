const fs = require('fs-extra');
const path = require('path');

const electronDir = path.join(__dirname, 'dist');
const mainJs = path.join(electronDir, 'main.js');
const preloadJs = path.join(electronDir, 'preload.js');
const appBuild = path.join(__dirname, '..', 'app', 'dist');
const targetDir = path.join('C:', 'Users', 'gal2729', 'Desktop', 'esnaadm-win32-x64', 'resources', 'app', 'dist')
const targetMainJs = path.join(targetDir, 'main.cjs');
const targetPreloadJs = path.join(targetDir, 'preload.js');

async function copyFolder() {
    await fs.copy(mainJs, targetMainJs,{overwrite:true});
    await fs.copy(preloadJs, targetPreloadJs, {overwrite:true})
    await fs.copy(appBuild, targetDir, {recursive: true,overwrite:true})
}

copyFolder().then()