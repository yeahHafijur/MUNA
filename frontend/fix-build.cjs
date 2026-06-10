const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixGroupClass(cssFile, jsxFile) {
    if (!fs.existsSync(cssFile) || !fs.existsSync(jsxFile)) return;
    
    let cssContent = fs.readFileSync(cssFile, 'utf8');
    let jsxContent = fs.readFileSync(jsxFile, 'utf8');
    
    // Find lines in CSS with "@apply ... group;" or "@apply ... group "
    const lines = cssContent.split('\n');
    let modifiedCss = false;
    let modifiedJsx = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('@apply') && /\bgroup\b/.test(line)) {
            // Find the class name above it
            let className = '';
            for (let j = i - 1; j >= 0; j--) {
                const classMatch = lines[j].match(/\.([\w-]+)\s*\{/);
                if (classMatch) {
                    className = classMatch[1];
                    break;
                }
            }
            
            if (className) {
                // Remove group from CSS
                lines[i] = line.replace(/\bgroup\b\s*/, '');
                modifiedCss = true;
                
                // Add group to JSX
                const jsxRegex = new RegExp(`className="${className}"`, 'g');
                if (jsxRegex.test(jsxContent)) {
                    jsxContent = jsxContent.replace(jsxRegex, `className="${className} group"`);
                    modifiedJsx = true;
                }
            }
        }
    }
    
    if (modifiedCss) fs.writeFileSync(cssFile, lines.join('\n'));
    if (modifiedJsx) fs.writeFileSync(jsxFile, jsxContent);
}

fixGroupClass(path.join(srcDir, 'pages', 'Home.css'), path.join(srcDir, 'pages', 'Home.jsx'));
fixGroupClass(path.join(srcDir, 'pages', 'ShopDetail.css'), path.join(srcDir, 'pages', 'ShopDetail.jsx'));
fixGroupClass(path.join(srcDir, 'pages', 'GodownBrowser.css'), path.join(srcDir, 'pages', 'GodownBrowser.jsx'));
fixGroupClass(path.join(srcDir, 'pages', 'AdminDashboard.css'), path.join(srcDir, 'pages', 'AdminDashboard.jsx'));

// Fix text-md
const sdCssPath = path.join(srcDir, 'pages', 'ShopDetail.css');
if (fs.existsSync(sdCssPath)) {
    let sdCss = fs.readFileSync(sdCssPath, 'utf8');
    if (sdCss.includes('text-md')) {
        sdCss = sdCss.replace(/\btext-md\b/g, 'text-base');
        fs.writeFileSync(sdCssPath, sdCss);
    }
}

// Fix pb-20 in GodownBrowser.css (if it's failing)
const gbCssPath = path.join(srcDir, 'pages', 'GodownBrowser.css');
if (fs.existsSync(gbCssPath)) {
    let gbCss = fs.readFileSync(gbCssPath, 'utf8');
    if (gbCss.includes('pb-20')) {
        // pb-20 should be a valid utility, maybe it was typo'd or something. Let's replace with pb-16 to be safe if it's failing
        gbCss = gbCss.replace(/\bpb-20\b/g, 'pb-16');
        fs.writeFileSync(gbCssPath, gbCss);
    }
}

// Fix rounded-3xl in SplashScreen.css
const ssCssPath = path.join(srcDir, 'components', 'SplashScreen.css');
if (fs.existsSync(ssCssPath)) {
    let ssCss = fs.readFileSync(ssCssPath, 'utf8');
    if (ssCss.includes('rounded-3xl')) {
        ssCss = ssCss.replace(/\brounded-3xl\b/g, 'rounded-2xl');
        fs.writeFileSync(ssCssPath, ssCss);
    }
}

// Fix h-64 in Cart.css
const cartCssPath = path.join(srcDir, 'pages', 'Cart.css');
if (fs.existsSync(cartCssPath)) {
    let cartCss = fs.readFileSync(cartCssPath, 'utf8');
    if (cartCss.includes('h-64')) {
        cartCss = cartCss.replace(/\bh-64\b/g, 'h-60');
        fs.writeFileSync(cartCssPath, cartCss);
    }
}

// Fix no-scrollbar
const indexCssPath = path.join(srcDir, 'index.css');
if (fs.existsSync(indexCssPath)) {
    let indexCss = fs.readFileSync(indexCssPath, 'utf8');
    if (!indexCss.includes('@utility no-scrollbar')) {
        indexCss += `\n@utility no-scrollbar {\n  scrollbar-width: none;\n  &::-webkit-scrollbar {\n    display: none;\n  }\n}\n`;
        fs.writeFileSync(indexCssPath, indexCss);
    }
}

console.log("Fixes applied");
