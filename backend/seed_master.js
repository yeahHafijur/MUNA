const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MasterProduct = require('./models/MasterProduct');
const fs = require('fs');

dotenv.config();

// JSON data ko padhna
const rawData = fs.readFileSync('./data.json', 'utf-8');
const productsData = JSON.parse(rawData);

// Database se connect karna
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/muna")
    .then(async () => {
        console.log("MongoDB Connected for Master Godown Seeding!");

        try {
            // Extract unique products
            const productsArray = Object.values(productsData).map(item => ({
                name: item.name,
                category: item.category,
                image: item.image
            }));

            // Filter out duplicates by name
            const uniqueProducts = [];
            const seenNames = new Set();
            for (const p of productsArray) {
                if (!seenNames.has(p.name.toLowerCase())) {
                    seenNames.add(p.name.toLowerCase());
                    uniqueProducts.push(p);
                }
            }

            // Clear existing master godown (optional, but good for a fresh start)
            await MasterProduct.deleteMany({});
            console.log("Cleared old Master Products.");

            // Insert new ones
            await MasterProduct.insertMany(uniqueProducts);
            console.log(`${uniqueProducts.length} unique products imported to Master Godown successfully!`);

            process.exit();
        } catch (error) {
            console.log("Error importing master data:", error);
            process.exit(1);
        }
    })
    .catch((err) => console.log("Connection Error:", err));
