const fs = require('fs-extra');
const path = require('path');

const oldPath = path.join(__dirname, 'dist', 'main.js');
const newPath = path.join(__dirname, 'dist', 'main.cjs');
const oldDir = path.join(__dirname,'..','app','dist');
const newDir = path.join(__dirname,'dist');
async function copyFolder(){
    await fs.rename(oldPath,newPath);
    await fs.copy(oldDir, newDir, {recursive:true})
}
copyFolder().then()