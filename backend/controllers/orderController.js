const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

// Function to send OneSignal push notification
const sendOneSignalNotification = async (playerIds, heading, message) => {
    if (!process.env.ONESIGNAL_REST_API_KEY || !playerIds || playerIds.length === 0) {
        console.log("Skipping OneSignal: Missing API Key or Player IDs");
        return;
    }

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: "f7ec7ea5-0da8-4703-b112-26e3707c3da1",
                include_subscription_ids: playerIds,
                headings: { en: heading },
                contents: { en: message }
            })
        });
        const data = await response.json();
        console.log("OneSignal push response:", data);
    } catch (error) {
        console.error("OneSignal push error:", error);
    }
};

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
        const { shopId, items, totalAmount, deliveryLocation, customerPhone } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty!" });
        }

        // --- ZOMATO/SWIGGY LOGIC (Single Shop & In-Stock Check) ---
        for (let i = 0; i < items.length; i++) {
            const product = await Product.findById(items[i].productId);

            if (!product) {
                return res.status(404).json({ message: `Product ${items[i].name} not found.` });
            }

            // Rule 1: Kya ye product usi dukan ka hai jis dukan se order ho raha hai?
            if (product.shopId.toString() !== shopId.toString()) {
                return res.status(400).json({
                    message: "You cannot order items from different shops at the same time!"
                });
            }

            // Rule 2: Kya ye product In Stock hai? (Aapne jo naya feature add kiya)
            if (product.inStock === false) {
                return res.status(400).json({
                    message: `Sorry, ${product.name} is currently out of stock.`
                });
            }
        }

        // Rule 3: Kya customer dukan ke 4 KM ke daayre me hai?
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found!" });
        }

        // Agar dukan ke paas location nahi hai, toh default Delhi ki location maan lo (testing ke liye)
        const shopLat = shop.location?.coordinates?.[1] || 28.6139;
        const shopLng = shop.location?.coordinates?.[0] || 77.2090;

        const custLat = deliveryLocation.lat;
        const custLng = deliveryLocation.lng;

        const distance = getDistanceFromLatLonInKm(shopLat, shopLng, custLat, custLng);

        if (distance > 100) {
            return res.status(400).json({ 
                message: `Sorry, this shop is ${distance.toFixed(1)} KM away. We only deliver within 100 KM.` 
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
            if (vendor && vendor.onesignalPlayerId) {
                await sendOneSignalNotification(
                    [vendor.onesignalPlayerId], 
                    "🎉 Naya Order Aaya Hai!", 
                    `Total: ₹${finalTotalAmount} (${items.length} items)`
                );
            }
        } catch (pushErr) {
            console.error("Error sending push notification to vendor:", pushErr);
        }

        // Update user's phone number if provided (saves for future)
        if (customerPhone) {
            const customer = await User.findById(req.user._id);
            if (customer && !customer.phone) {
                customer.phone = customerPhone;
                await customer.save();
            }
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
            return res.status(404).json({ message: "You don't have any shop." });
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
            return res.status(404).json({ message: "Order not found" });
        }

        // Security: Kya ye order ishi vendor ki shop ka hai?
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (order.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "You cannot update orders of another shop" });
        }

        order.status = status;
        const updatedOrder = await order.save();

        // 🔔 PUSH NOTIFICATION ALERT TO CUSTOMER
        try {
            const customer = await User.findById(order.customerId);
            if (customer && customer.onesignalPlayerId) {
                let statusMessage = "Your order status has been updated.";
                if (status === 'accepted') statusMessage = "Yay! Your order has been accepted by the shop.";
                else if (status === 'packed') statusMessage = "Your order is packed and ready!";
                else if (status === 'out_for_delivery') statusMessage = "Your order is out for delivery! 🛵";
                else if (status === 'delivered') statusMessage = "Your order has been delivered. Enjoy! 🎉";
                else if (status === 'cancelled') statusMessage = "Your order was cancelled.";

                await sendOneSignalNotification(
                    [customer.onesignalPlayerId], 
                    "Order Update 📦", 
                    statusMessage
                );
            }
        } catch (pushErr) {
            console.error("Error sending push notification to customer:", pushErr);
        }

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
