const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/pages/GodownBrowser.jsx',
    'src/pages/DailyMarketItemDetail.jsx',
    'src/pages/DailyMarket.jsx',
    'src/pages/CustomerSettings.jsx'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace exact patterns
        content = content.replace(/if \(!token\)/g, 'if (!user)');
        
        fs.writeFileSync(fullPath, content);
        console.log('Fixed token in:', fullPath);
    }
});
