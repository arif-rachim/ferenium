const fse = require('fs-extra');
const path = require('path');

// Specify the directory you want to delete
const appDir = path.join(__dirname,'public','app');
const logDir = path.join(__dirname,'public','log');

// Function to delete the directory
async function deleteDirectory(dirPath) {
    try {
        // Check if the directory exists
        await fse.access(dirPath);

        // Delete the directory and its contents recursively
        await fse.remove(dirPath);
        console.log(`Successfully deleted ${dirPath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Directory ${dirPath} does not exist.`);
        } else {
            console.error(`Error deleting directory:`, error);
        }
    }
}

// House keeping is for cleaning up the directory.
(async() => {
    await deleteDirectory(appDir);
    await deleteDirectory(logDir);
})();