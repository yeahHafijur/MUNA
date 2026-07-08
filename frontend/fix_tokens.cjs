const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (content.includes('!!token')) {
                content = content.replace(/!!token &&/g, '');
                content = content.replace(/&& !!token/g, '');
                content = content.replace(/enabled:\s*!!token\s*,/g, 'enabled: true,');
                content = content.replace(/enabled:\s*!!token\s*\n/g, 'enabled: true\n');
                modified = true;
            }

            if (content.includes('if (!token')) {
                content = content.replace(/if\s*\(\!token\s*\|\|\s*/g, 'if (');
                content = content.replace(/if\s*\(\!user\s*\|\|\s*\!token\)/g, 'if (!user)');
                modified = true;
            }

            if (content.includes('Authorization: `Bearer ${token}`')) {
                content = content.replace(/Authorization:\s*`Bearer\s*\$\{token\}`/g, '');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed token usage in:', fullPath);
            }
        }
    }
}
processDir(path.join(__dirname, 'src'));
