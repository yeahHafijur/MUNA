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

            // Remove Authorization headers
            const authRegex1 = /,\s*headers:\s*\{\s*['"]?Authorization['"]?:\s*`Bearer \$\{token\}`\s*\}/g;
            if (authRegex1.test(content)) {
                content = content.replace(authRegex1, '');
                modified = true;
            }
            
            const authRegex2 = /headers:\s*\{\s*['"]?Authorization['"]?:\s*`Bearer \$\{token\}`\s*\}/g;
            if (authRegex2.test(content)) {
                content = content.replace(authRegex2, '');
                modified = true;
            }

            // Replace fetch(url) with fetch(url, { credentials: 'include' }) for /api calls
            const fetchRegex1 = /fetch\(([`'"].*?\/api.*?[`'"])\)/g;
            if (fetchRegex1.test(content)) {
                content = content.replace(fetchRegex1, 'fetch($1, { credentials: \'include\' })');
                modified = true;
            }
            
            // Handle template literals fetch(`/api/something`)
            const fetchRegex3 = /fetch\(([`'"].*?\/api.*?.*?[`'"])\)/g;
            if (fetchRegex3.test(content)) {
                content = content.replace(fetchRegex3, 'fetch($1, { credentials: \'include\' })');
                modified = true;
            }

            // Add credentials to existing fetch options
            const fetchRegex2 = /fetch\((.*?)((?:,|\s)*)\{/g;
            if (fetchRegex2.test(content)) {
                // To avoid double credentials, only add if not present
                const parts = content.split('fetch(');
                let newContent = parts[0];
                for (let i = 1; i < parts.length; i++) {
                    let p = parts[i];
                    if (p.includes('{') && !p.includes('credentials:')) {
                        p = p.replace('{', '{ credentials: \'include\', ');
                    }
                    newContent += 'fetch(' + p;
                }
                if (content !== newContent) {
                    content = newContent;
                    modified = true;
                }
            }

            // Clean up empty headers: {} or headers: { Authorization: `Bearer ${token}` } completely empty now
            content = content.replace(/,\s*headers:\s*\{\s*\}/g, '');
            content = content.replace(/headers:\s*\{\s*\}/g, '');

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
