require("dotenv").config();
const mongoose = require("mongoose");
async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const MasterProduct = require("./models/MasterProduct");
        const cats = await MasterProduct.distinct("category");
        console.log("Distinct MasterProduct categories:");
        console.log(cats);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
