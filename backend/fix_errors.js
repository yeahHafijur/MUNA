const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
        } catch (err) {
            if (err.code === 'OENT' || err.code === 'EPERM') {}
        }
    });
    return filelist;
};

const files = walkSync(path.join(__dirname, 'controllers'));

files.forEach(file => {
    if (file.endsWith('.js')) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace `error: error.message` with nothing, but handle the trailing comma or leading comma
        content = content.replace(/,\s*error:\s*error\.message/g, '');
        content = content.replace(/error:\s*error\.message\s*,?/g, '');
        fs.writeFileSync(file, content);
    }
});
console.log('Done');
