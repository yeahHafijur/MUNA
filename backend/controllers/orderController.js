const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

const Notification = require('../models/Notification');

const adminApp = require('../firebaseAdmin');
const { getMessaging } = require('firebase-admin/messaging');

// Function to send Firebase Cloud Messaging push notification (Premium with Cleanup)
const sendFCMNotification = async (userIds, heading, message, route = "/") => {
    if (!adminApp) return console.log("[FCM] ❌ SKIPPED: Firebase Admin not initialized.");
    if (!userIds || userIds.length === 0) return console.log("[FCM] ❌ SKIPPED: No valid User IDs!");

    try {
        const users = await User.find({ _id: { $in: userIds } });
        let tokens = [];

        users.forEach(user => {
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                tokens = tokens.concat(user.fcmTokens);
            }
        });

        tokens = [...new Set(tokens)]; // Remove duplicates
        if (tokens.length === 0) return console.log(`[FCM] ❌ No FCM tokens found for users: ${userIds}`);

        const messagePayload = {
            notification: { title: heading, body: message },
            data: { route: route }, // Frontend ko click karne par kis page par bhejna hai
            tokens: tokens,
        };

        const response = await getMessaging(adminApp).sendEachForMulticast(messagePayload);
        console.log(`[FCM] ✅ Push sent! Success: ${response.successCount}, Failed: ${response.failureCount}`);

        // 🧹 GHOST TOKEN CLEANUP LOGIC (Premium Architecture)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errCode = resp.error?.code;
                    // Agar token expire ho gaya hai ya invalid hai, list mein daalo
                    if (errCode === 'messaging/invalid-registration-token' ||
                        errCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(tokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                // Database se dead tokens hamesha ke liye remove kar do
                await User.updateMany(
                    { _id: { $in: userIds } },
                    { $pull: { fcmTokens: { $in: failedTokens } } }
                );
                console.log(`[FCM] 🧹 Cleaned up ${failedTokens.length} dead tokens from DB.`);
            }
        }
    } catch (error) {
        console.error("[FCM] ❌ Error sending push:", error);
    }
};

// Helper to send push and save to DB
const sendAndSaveNotification = async (userIds, heading, message, actionUrl = "") => {
    await sendFCMNotification(userIds, heading, message);

    try {
        const notificationsToInsert = userIds.map(id => ({
            userId: id,
            title: heading,
            message: message,
            actionUrl: actionUrl,
            isRead: false
        }));
        await Notification.insertMany(notificationsToInsert);
        console.log(`[DB] ✅ Saved ${notificationsToInsert.length} notifications to database.`);
    } catch (error) {
        console.error("[DB] ❌ Failed to save notification:", error);
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
        const { shopId, items, totalAmount, deliveryLocation, customerPhone, instructions } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty!" });
        }

        // --- ZOMATO/SWIGGY LOGIC (Single Shop & In-Stock Check) ---
        const productIds = items.map(i => i.productId);
        const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

        for (const item of items) {
            const product = productMap.get(item.productId.toString());

            if (!product) {
                return res.status(404).json({ message: `Product ${item.name} not found.` });
            }

            // Rule 1: Kya ye product usi dukan ka hai jis dukan se order ho raha hai?
            if (product.shopId.toString() !== shopId.toString()) {
                return res.status(400).json({
                    message: "You cannot order items from different shops at the same time!"
                });
            }

            // Rule 2: Kya ye product In Stock hai? 
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

        // Rule 4: Shop open hai ya closed?
        if (!shop.isOpen) {
            return res.status(400).json({
                message: "This shop is currently closed. You cannot place an order right now."
            });
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

        // Recalculate delivery fee securely on backend
        const settings = shop.deliverySettings || { minOrderAmount: 0, minimumCharge: 10, minimumDistance: 1, chargePerKm: 5 };
        let fee = settings.minimumCharge;
        if (distance > settings.minimumDistance) {
            const extraKm = Math.ceil(distance - settings.minimumDistance);
            fee += (extraKm * settings.chargePerKm);
        }

        // Securely calculate items total using DATABASE prices (not frontend prices)
        let itemsTotal = 0;
        const verifiedItems = [];
        for (const item of items) {
            const dbProduct = await Product.findById(item.productId);
            if (!dbProduct) {
                return res.status(404).json({ message: `Product ${item.name} not found.` });
            }
            itemsTotal += (dbProduct.price * item.quantity);
            verifiedItems.push({
                productId: item.productId,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity
            });
        }

        // Rule 5: Minimum Order Amount Check
        if (settings.minOrderAmount > 0 && itemsTotal < settings.minOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount (excluding delivery) for this shop is ₹${settings.minOrderAmount}. Your current item total is ₹${itemsTotal}. Please add more items.`
            });
        }

        // Final total amount
        const finalTotalAmount = itemsTotal + fee;

        // 🚀 NEW LOGIC: GENERATE 4-DIGIT DELIVERY OTP
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Sab theek hai, toh ab Order banate hain!
        const order = await Order.create({
            customerId: req.user._id,
            shopId,
            items: verifiedItems,
            totalAmount: finalTotalAmount,
            deliveryFee: fee,
            deliveryLocation,
            instructions: instructions || '',
            deliveryOtp: generatedOtp
        });

        // 🔔 PUSH NOTIFICATION ALERT TO VENDOR
        try {
            const vendor = await User.findById(shop.vendorId);
            if (vendor) {
                await sendAndSaveNotification(
                    [vendor._id],
                    "📦 New Order Received!",
                    `Amount: ₹${finalTotalAmount} (${items.length} items). Please review and accept.`,
                    "/vendor-dashboard"
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
        console.error("placeOrder error:", error);
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

// 2. Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if the order belongs to this customer
        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to cancel this order" });
        }

        // Only allow cancellation if status is "pending"
        if (order.status !== "pending") {
            return res.status(400).json({ message: "You can only cancel pending orders. If it is already accepted, please contact the vendor." });
        }

        order.status = "cancelled";
        await order.save();

        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Get Customer's Orders
const getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user._id })
            .populate('shopId', 'name address image')
            .sort('-createdAt');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Get Vendor's Orders (with pagination, search, filters)
const getVendorOrders = async (req, res) => {
    try {
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: "You don't have any shop." });
        }

        const { page = 1, limit = 20, status, search, from, to, date } = req.query;

        let filter = { shopId: shop._id };

        // Status filter
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Date range filter
        if (date) {
            const queryDate = new Date(date);
            const startOfDay = new Date(queryDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(queryDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        } else if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
        }

        let query = Order.find(filter)
            .select('-deliveryOtp') // Security: Don't send OTP to vendor, otherwise they can cheat via DevTools!
            .populate('customerId', 'name email phone')
            .sort('-createdAt');

        const total = await Order.countDocuments(filter);
        const skip = (Number(page) - 1) * Number(limit);

        const orders = await query.skip(skip).limit(Number(limit));

        let filteredOrders = orders;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredOrders = orders.filter(o =>
                o._id.toString().toLowerCase().includes(searchLower) ||
                (o.customerId?.name || '').toLowerCase().includes(searchLower) ||
                (o.customerId?.phone || '').includes(search)
            );
        }

        res.status(200).json({
            orders: filteredOrders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status, deliveryOtp } = req.body;

        // Validate status value
        const validStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Security: Kya ye order ishi vendor ki shop ka hai?
        const shop = await Shop.findOne({ vendorId: req.user._id });
        if (!shop) {
            return res.status(403).json({ message: "You don't have a shop" });
        }
        if (order.shopId.toString() !== shop._id.toString()) {
            return res.status(403).json({ message: "You cannot update orders of another shop" });
        }

        // 🚀 NEW LOGIC: VERIFY OTP IF VENDOR MARKS AS DELIVERED
        if (status === 'delivered' && order.deliveryOtp) {
            if (!deliveryOtp) {
                return res.status(400).json({ message: "Delivery PIN is required to complete this order." });
            }
            if (order.deliveryOtp !== deliveryOtp.toString()) {
                return res.status(400).json({ message: "Incorrect PIN! Please ask the customer for the correct 4-digit PIN." });
            }

            // Increment salesCount for each product in the order
            try {
                const productIds = order.items.map(item => item.productId);
                await Product.updateMany(
                    { _id: { $in: productIds } },
                    { $inc: { salesCount: 1 } }
                );
            } catch (err) {
                console.error("Failed to increment salesCount:", err);
            }
        }

        order.status = status;
        const updatedOrder = await order.save();

        // 🔔 PUSH NOTIFICATION ALERT TO CUSTOMER
        try {
            const customer = await User.findById(order.customerId);
            if (customer) {
                let statusMessage = "Your order status has been updated.";
                if (status === 'accepted') statusMessage = "Your order has been accepted by the store!";
                else if (status === 'preparing') statusMessage = "Your order is being prepared!";
                else if (status === 'out_for_delivery') statusMessage = "Your order is out for delivery! Please keep your Delivery PIN ready.";
                else if (status === 'delivered') statusMessage = "Your order has been delivered. Thank you!";
                else if (status === 'cancelled') statusMessage = "Your order was cancelled.";

                await sendAndSaveNotification(
                    [customer._id],
                    "Order Update 📦",
                    statusMessage,
                    "/profile"
                );
            }
        } catch (pushErr) {
            console.error("Error sending push notification to customer:", pushErr);
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("updateOrderStatus error:", error);
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

// @desc    Get all orders (Super Admin Monitor)
// @route   GET /api/orders/admin/all
// @access  Protected (Super Admin)
const getAllOrdersForAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Access denied. Super Admin only." });
        }
        
        // Date filtering logic (default to today if not provided)
        let queryDate = req.query.date ? new Date(req.query.date) : new Date();
        
        // Start of the day
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        // End of the day
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const filter = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };
        
        const orders = await Order.find(filter)
            .populate('shopId', 'name vendorId address isActive')
            .populate('customerId', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error("getAllOrdersForAdmin error:", error);
        res.status(500).json({ message: "Failed to fetch orders." });
    }
};

module.exports = {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder,
    getAllOrdersForAdmin
};