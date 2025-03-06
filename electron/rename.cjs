const fs = require('fs');
const path = require('path');

const oldPath = path.join(__dirname,'..', 'dist', 'main.js');
const newPath = path.join(__dirname,'..', 'dist', 'main.cjs');

fs.rename(oldPath, newPath, (err) => {
    if (err) {
        console.error('Error renaming file:', err);
    } else {
        console.log('File renamed successfully!');
    }
});