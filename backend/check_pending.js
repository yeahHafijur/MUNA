require("dotenv").config();
const mongoose = require("mongoose");
async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Product = require("./models/Product");
        const pendings = await Product.find({ approvalStatus: 'pending' }).lean();
        console.log("Pending Products:");
        for (const p of pendings) {
            console.log(`Name: ${p.name}, Created: ${p.createdAt}, Shop: ${p.shopId}`);
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
