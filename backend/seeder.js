const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const fs = require('fs');

dotenv.config();

// JSON data ko padhna
const rawData = fs.readFileSync('./data.json', 'utf-8');
const productsData = JSON.parse(rawData);

// Database se connect karna
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected for Seeding!");

        try {
            // 1. Ek dummy Shop banate hain jisme ye saare products jayenge
            const shop = await Shop.create({
                name: "MUNA Super Mart",
                address: "Main Market, City",
                // Yahan aap apna _id daalein jo login ke time console me aaya tha
                vendorId: "6a16f22c6d76b8490fd3b245"
            });

            console.log("Shop Created!");

            // 2. JSON Object ko Array me convert karke products ko taiyar karna
            // Kyunki aapka data "product104": {...} is format me hai
            const productsArray = Object.values(productsData).map(item => {
                return {
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    image: item.image,
                    stock: 50, // Sabme default 50 daal dete hain
                    shopId: shop._id // Sabko is shop se connect kar diya
                };
            });

            // 3. Saare products ek sath database me daalna
            await Product.insertMany(productsArray);
            console.log(`${productsArray.length} Products imported successfully!`);

            process.exit(); // Kaam khatam hone ke baad script band kar dena

        } catch (error) {
            console.log("Error importing data:", error);
            process.exit(1);
        }
    })
    .catch((err) => console.log("Connection Error:", err));
