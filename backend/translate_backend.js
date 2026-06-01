const fs = require('fs');
const path = require('path');

const replacements = {
    // shopController.js
    '"Shop nahi mili"': '"Shop not found"',
    '"Aapki koi shop nahi hai"': `"You don't have any shop"`,
    '"Ek vendor sirf ek hi shop bana sakta hai"': '"A vendor can only create one shop"',
    
    // productController.js
    '"Product nahi mila"': '"Product not found"',
    '"Aap kisi aur ki shop ka product update nahi kar sakte!"': '"You cannot update products of another shop!"',
    '"Aap kisi aur ki shop ka product delete nahi kar sakte!"': '"You cannot delete products of another shop!"',
    
    // orderController.js
    '"Aapka cart khali hai!"': '"Your cart is empty!"',
    '`Product ${items[i].name} nahi mila.`': '`Product ${items[i].name} not found.`',
    '"Aap ek sath alag-alag dukanon se saman order nahi kar sakte! (Single Shop Rule)"': '"You cannot order items from different shops at the same time!"',
    '`Sorry, ${product.name} out of stock ho gaya hai.`': '`Sorry, ${product.name} is currently out of stock.`',
    '"Dukan nahi mili!"': '"Shop not found!"',
    '`Sorry, ye dukan aapki location se ${distance.toFixed(1)} KM door hai. Hum sirf 100 KM tak deliver karte hain!`': '`Sorry, this shop is ${distance.toFixed(1)} KM away. We only deliver within 100 KM.`',
    '"Aapki koi shop nahi hai."': `"You don't have any shop."`,
    '"Order nahi mila"': '"Order not found"',
    '"Aap kisi aur ki shop ka order update nahi kar sakte"': '"You cannot update orders of another shop"',
    
    // adminController.js
    '"Aapke paas ye power nahi hai."': '"You do not have permission to perform this action."',
    '"Is phone number se pehle se koi user/vendor bana hua hai."': '"A user/vendor with this phone number already exists."',
    '"Vendor aur Shop dono successfully onboard ho gaye!"': '"Vendor and Shop successfully onboarded!"'
};

const controllersDir = path.join(__dirname, 'controllers');

const files = fs.readdirSync(controllersDir);

for (const file of files) {
    if (file.endsWith('.js')) {
        const filePath = path.join(controllersDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let updated = false;
        for (const [hinglish, english] of Object.entries(replacements)) {
            if (content.includes(hinglish)) {
                content = content.replaceAll(hinglish, english);
                updated = true;
            }
        }
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Translated file: ${file}`);
        }
    }
}
console.log("Translation complete!");
