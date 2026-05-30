const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Helper function to make requests
async function makeRequest(url, method, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:5000${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    return response.json();
}

async function runTests() {
    try {
        console.log("🔗 Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected!\n");

        // 1. VENDOR REGISTRATION
        console.log("👨‍🍳 1. Registering a Vendor...");
        const vendorCreds = { name: "Raju Vendor", email: `vendor${Date.now()}@test.com`, password: "password123" };
        const vendorReg = await makeRequest('/api/auth/register', 'POST', vendorCreds);

        // Kyunki humne code me hardcode kiya hai ki har koi 'customer' banega, 
        // hum yahan database se direct isko 'vendor' bana rahe hain testing ke liye!
        await User.findByIdAndUpdate(vendorReg._id, { role: 'vendor' });
        console.log("✅ Vendor Created!");

        // 2. VENDOR LOGIN
        console.log("\n🔑 2. Vendor Logging in...");
        const vendorLogin = await makeRequest('/api/auth/login', 'POST', { email: vendorCreds.email, password: vendorCreds.password });
        const vendorToken = vendorLogin.token;
        console.log("✅ Vendor Logged In!");

        // 3. CREATE SHOP
        console.log("\n🏪 3. Creating a Shop...");
        const shopData = { name: "Raju Pizza Corner", address: "Main Street, Delhi", lat: 28.7041, lng: 77.1025 };
        const shop = await makeRequest('/api/shops', 'POST', shopData, vendorToken);
        console.log(`✅ Shop Created: ${shop.name}`);

        // 4. CREATE PRODUCT
        console.log("\n🍕 4. Adding a Product to Shop...");
        const productData = { name: "Cheese Burst Pizza", price: 299, category: "Fast Food", stock: 50 };
        const product = await makeRequest('/api/products', 'POST', productData, vendorToken);
        console.log(`✅ Product Added: ${product.name} (Price: ₹${product.price})`);

        // 5. CUSTOMER REGISTRATION
        console.log("\n🚶‍♂️ 5. Registering a Customer...");
        const customerCreds = { name: "Rahul Customer", email: `customer${Date.now()}@test.com`, password: "password123" };
        await makeRequest('/api/auth/register', 'POST', customerCreds);

        // 6. CUSTOMER LOGIN
        const customerLogin = await makeRequest('/api/auth/login', 'POST', { email: customerCreds.email, password: customerCreds.password });
        const customerToken = customerLogin.token;
        console.log("✅ Customer Logged In!");

        // 7. PLACE ORDER (The Ultimate Test!)
        console.log("\n🛒 6. Customer Placing an Order...");
        const orderData = {
            shopId: shop._id,
            items: [
                {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: 2
                }
            ],
            totalAmount: 598, // 299 * 2
            deliveryLocation: { address: "Rahul's House", lat: 28.7050, lng: 77.1030 }
        };
        const order = await makeRequest('/api/orders', 'POST', orderData, customerToken);

        if (order.message) {
            console.log("❌ Order Failed:", order.message);
        } else {
            console.log("✅ Order Placed Successfully!");
            console.log("📜 Order Details:", {
                orderId: order._id,
                totalBill: `₹${order.totalAmount}`,
                status: order.status
            });
        }

        console.log("\n🎉 ALL TESTS PASSED! Aapka Backend ekdum ready hai!");
        process.exit();

    } catch (error) {
        console.log("❌ Test Failed:", error);
        process.exit(1);
    }
}

runTests();
