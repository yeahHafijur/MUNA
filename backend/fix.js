require("dotenv").config();
const mongoose = require("mongoose");
async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const MasterProduct = require("./models/MasterProduct");
        const ItemCategory = require("./models/ItemCategory");
        
        const badProducts = await MasterProduct.find({ category: { $regex: /^[0-9a-fA-F]{24}$/ } });
        console.log("Fixing", badProducts.length, "products");
        let fixedCount = 0;
        
        for (const p of badProducts) {
            const cat = await ItemCategory.findById(p.category);
            const newCat = cat ? cat.name : "General";
            console.log(`Product: ${p.name}, Old Cat: ${p.category}, New Cat: ${newCat}`);
            p.category = newCat;
            await p.save();
            fixedCount++;
        }
        
        console.log("Fixed", fixedCount, "products");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
