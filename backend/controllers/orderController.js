const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const webpush = require('web-push');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your_email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Haversine formula: Do (2) GPS points ke beech ka distance (KM) nikalne ke liye
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Prithvi ka radius KM mein
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance KM mein
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// 1. Place Order (Customer karega)
const placeOrder = async (req, res) => {
    try {
        const { shopId, items, totalAmount, deliveryLocation } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Aapka cart khali hai!" });
        }

        // --- ZOMATO/SWIGGY LOGIC (Single Shop & In-Stock Check) ---
        for (let i = 0; i < items.length; i++) {
            const product = await Product.findById(items[i].productId);

            if (!product) {
                return res.status(404).json({ message: `Product ${items[i].name} nahi mila.` });
            }

            // Rule 1: Kya ye product usi dukan ka hai jis dukan se order ho raha hai?
            if (product.shopId.toString() !== shopId.toString()) {
                return res.status(400).json({
                    message: "Aap ek sath alag-alag dukanon se saman order nahi kar sakte! (Single Shop Rule)"
                });
            }

            // Rule 2: Kya ye product In Stock hai? (Aapne jo naya feature add kiya)
            if (product.inStock === false) {
                return res.status(400).json({
                    message: `Sorry, ${product.name} out of stock ho gaya hai.`
                });
            }
        }

        // Rule 3: Kya customer dukan ke 4 KM ke daayre me hai?
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: "Dukan nahi mili!" });
        }

        // Agar dukan ke paas location nahi hai, toh default Delhi ki location maan lo (testing ke liye)
        const shopLat = shop.location?.coordinates?.[1] || 28.6139;
        const shopLng = shop.location?.coordinates?.[0] || 77.2090;

        const custLat = deliveryLocation.lat;
        const custLng = deliveryLocation.lng;

        const distance = getDistanceFromLatLonInKm(shopLat, shopLng, custLat, custLng);

        if (distance > 100) {
            return res.status(400).json({ 
                message: `Sorry, ye dukan aapki location se ${distance.toFixed(1)} KM door hai. Hum sirf 100 KM tak deliver karte hain!` 
            });
        }
        // ---------------------------------------------------------

        // Recalculate delivery fee securely on backend
        const settings = shop.deliverySettings || { minimumCharge: 10, minimumDistance: 2, chargePerKm: 5 };
        let fee = settings.minimumCharge;
        if (distance > settings.minimumDistance) {
            const extraKm = Math.ceil(distance - settings.minimumDistance);
            fee += (extraKm * settings.chargePerKm);
        }

        // Validate items total
        let itemsTotal = 0;
        for (const item of items) {
            itemsTotal += (item.price * item.quantity);
        }

        // Final total amount
        const finalTotalAmount = itemsTotal + fee;

        // Sab theek hai, toh ab Order banate hain!
        const order = await Order.create({
            customerId: req.user._id, // Bouncer (authMiddleware) se customer ki id mil gayi
            shopId,
            items,
            totalAmount: finalTotalAmount,
            deliveryFee: fee,
            deliveryLocation
        });

        // 🔔 PUSH NOTIFICATION ALERT TO VENDOR
        try {
            const vendor = await User.findById(shop.vendorId);
            if (vendor && vendor.pushSubscription) {
                const payload = JSON.stringify({
                    title: '🎉 Naya Order Aaya Hai!',
                    body: `Total: ₹${finalTotalAmount} (${items.length} items)`,
                    icon: '/icon-192x192.png', // PWA icon
                });
                await webpush.sendNotification(vendor.pushSubscription, payload);
                console.log("Push notification sent to vendor!");
            }
        } catch (pushErr) {
            console.error("Error sending push notification:", pushErr);
        }

        res.status(201).json(order);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 2. Get Customer's Orders (Customer apni Order History dekhega)
const getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user._id })
            .populate('shopId', 'name address image') // Shop ka naam aur address
            .sort('-createdAt'); // Naye orders upar dikhein
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 3. Get Vendor's Orders (Vendor apne Dashboard me dekhega)
const getVendorOrders = async (req, res) => {
    try {
        // Pehle dekho vendor ki dukan kaunsi hai
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "Aapki koi shop nahi hai." });
        }

        const orders = await Order.find({ shopId: shop._id })
            .populate('customerId', 'name email phone') // Customer ka naam aur number
            .sort('-createdAt');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 4. Update Order Status (Vendor order accept/deliver karega)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order nahi mila" });
        }

        // Security: Kya ye order ishi vendor ki shop ka hai?
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (order.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "Aap kisi aur ki shop ka order update nahi kar sakte" });
        }

        order.status = status;
        const updatedOrder = await order.save();

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus
};
