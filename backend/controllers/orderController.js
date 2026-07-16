const Order = require('../models/Order');
const mongoose = require('mongoose');
const { getDistanceFromLatLonInKm } = require('../utils/geo');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

const { sendAndSaveNotification } = require('../utils/notificationService');


// 1. Place Order (Customer karega)
const placeOrder = async (req, res) => {
    let session;
    try {
        const { shopId, items, totalAmount, deliveryLocation, customerPhone, instructions } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty!" });
        }
        
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({ message: "Invalid Shop ID" });
        }

        const custLat = deliveryLocation.lat;
        const custLng = deliveryLocation.lng;

        // Rule 3: Distance calculation using MongoDB $geoNear
        const shopResults = await Shop.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [custLng, custLat] },
                    distanceField: "calculatedDistance",
                    distanceMultiplier: 0.001, // convert meters to km
                    query: { _id: new mongoose.Types.ObjectId(shopId) },
                    spherical: true
                }
            }
        ]);

        if (!shopResults || shopResults.length === 0) {
            // Fallback: If no coordinates or index fails, just find the shop normally
            const fallbackShop = await Shop.findById(shopId);
            if (!fallbackShop) return res.status(404).json({ message: "Shop not found!" });
            shopResults.push({ ...fallbackShop.toObject(), calculatedDistance: 0 });
        }

        const shop = shopResults[0];
        const distance = shop.calculatedDistance || 0;

        if (!shop.isOpen) {
            return res.status(400).json({ message: "This shop is currently closed. You cannot place an order right now." });
        }

        const maxRange = shop.deliverySettings?.maxRange || 5;
        if (distance > maxRange) {
            return res.status(400).json({
                message: `Sorry, this shop is ${distance.toFixed(1)} KM away. Delivery is only within ${maxRange} KM.`
            });
        }

        const settings = shop.deliverySettings || { minOrderAmount: 0, minimumCharge: 10, minimumDistance: 1, chargePerKm: 5 };
        let fee = settings.minimumCharge;
        if (distance > settings.minimumDistance) {
            const extraKm = Math.ceil(distance - settings.minimumDistance);
            fee += (extraKm * settings.chargePerKm);
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const productIds = items.map(i => i.productId);
        const dbProducts = await Product.find({ _id: { $in: productIds } }).session(session).lean();
        const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

        let itemsTotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const product = productMap.get(item.productId.toString());
            if (!product) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Product ${item.name} not found.` });
            }
            if (product.shopId.toString() !== shopId.toString()) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: "You cannot order items from different shops at the same time!" });
            }
            if (product.inStock === false) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Sorry, ${product.name} is currently out of stock.` });
            }

            itemsTotal += (product.price * item.quantity);
            verifiedItems.push({
                productId: item.productId,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        if (settings.minOrderAmount > 0 && itemsTotal < settings.minOrderAmount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: `Minimum order amount (excluding delivery) for this shop is ₹${settings.minOrderAmount}. Your current item total is ₹${itemsTotal}. Please add more items.`
            });
        }

        const finalTotalAmount = itemsTotal + fee;
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        const orderResult = await Order.create([{
            customerId: req.user._id,
            shopId,
            items: verifiedItems,
            totalAmount: finalTotalAmount,
            deliveryFee: fee,
            deliveryLocation,
            instructions: instructions || '',
            deliveryOtp: generatedOtp
        }], { session });

        await session.commitTransaction();
        session.endSession();

        const order = orderResult[0];

        // Fire-and-forget: don't block API response for push notification
        if (shop.vendorId) {
            sendAndSaveNotification(
                [shop.vendorId],
                "🚨 New Order Received!",
                `Amount: ₹${finalTotalAmount} (${items.length} items). Please review and accept.`,
                { 
                    actionUrl: "/vendor-dashboard", 
                    route: "/vendor/orders", 
                    type: "order",
                    androidOptions: {
                        channelId: "new-orders-v2",
                        sound: "ringtone" // Without extension for FCM
                    }
                }
            );
        }

        if (customerPhone) {
            await User.updateOne(
                { _id: req.user._id, phone: { $exists: false } },
                { $set: { phone: customerPhone } }
            );
        }

        res.status(201).json(order);

    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
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

        // Notify the vendor that the customer cancelled the order
        try {
            const Shop = require('../models/Shop'); // Ensure Shop is loaded if not globally available, though it is imported at the top
            const shop = await Shop.findById(order.shopId);
            if (shop && shop.vendorId) {
                sendAndSaveNotification(
                    [shop.vendorId],
                    "❌ Order Cancelled",
                    `A pending order (₹${order.totalAmount || 0}) was just cancelled by the customer.`,
                    { 
                        route: "/vendor/orders",
                        type: "order" 
                    }
                );
            }
        } catch (err) {
            console.error("Failed to send cancel notification to vendor:", err);
        }

        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Get Customer's Orders
const getCustomerOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const filter = { customerId: req.user._id };
        const total = await Order.countDocuments(filter);
        
        const orders = await Order.find(filter)
            .populate('shopId', 'name address image')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
            
        res.status(200).json({
            orders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("getCustomerOrders error:", error);
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

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const matchingUsers = await User.find({
                $or: [{ name: searchRegex }, { phone: searchRegex }]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            
            filter.$or = [
                { customerId: { $in: userIds } }
            ];
            
            if (mongoose.Types.ObjectId.isValid(search)) {
                filter.$or.push({ _id: search });
            }
        }

        let query = Order.find(filter)
            .select('-deliveryOtp') // Security: Don't send OTP to vendor, otherwise they can cheat via DevTools!
            .populate('customerId', 'name email phone')
            .sort('-createdAt');

        const total = await Order.countDocuments(filter);
        const skip = (Number(page) - 1) * Number(limit);

        const orders = await query.skip(skip).limit(Number(limit)).lean();

        res.status(200).json({
            orders: orders,
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

        const validStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const validTransitions = {
            'pending': ['accepted', 'cancelled'],
            'accepted': ['preparing', 'cancelled'],
            'preparing': ['out_for_delivery', 'cancelled'],
            'out_for_delivery': ['delivered'],
            'delivered': [],
            'cancelled': []
        };

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!validTransitions[order.status]?.includes(status)) {
            return res.status(400).json({ message: `Cannot transition from '${order.status}' to '${status}'` });
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
                if (order.items && order.items.length > 0) {
                    const bulkOps = order.items.map(item => ({
                        updateOne: {
                            filter: { _id: item.productId },
                            update: { $inc: { salesCount: item.quantity } }
                        }
                    }));
                    const bulkResult = await Product.bulkWrite(bulkOps);
                    console.log(`[Order ${order._id}] Successfully updated sales counts for ${bulkResult.modifiedCount} products.`);
                }
            } catch (err) {
                console.error(`[Order ${order._id}] Failed to increment salesCount in bulkWrite:`, err);
                // Non-fatal error, continue
            }
        }

        order.status = status;
        const updatedOrder = await order.save();

        // 🔔 Fire-and-forget: Push notification to customer
        let statusMessage = "Your order status has been updated.";
        if (status === 'accepted') statusMessage = "Your order has been accepted by the store!";
        else if (status === 'preparing') statusMessage = "Your order is being prepared!";
        else if (status === 'out_for_delivery') statusMessage = "Your order is out for delivery! Please keep your Delivery PIN ready.";
        else if (status === 'delivered') statusMessage = "Your order has been delivered. Thank you!";
        else if (status === 'cancelled') statusMessage = "Your order was cancelled.";

        sendAndSaveNotification(
            [order.customerId],
            "Order Update 📦",
            statusMessage,
            { actionUrl: "/orders", route: "/orders", type: "order" }
        );

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
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(orders);
    } catch (error) {
        console.error("getAllOrdersForAdmin error:", error);
        res.status(500).json({ message: "Failed to fetch orders." });
    }
};

// Get Active Order for Customer
const getActiveOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            customerId: req.user._id,
            status: { $in: ['pending', 'accepted', 'preparing', 'out_for_delivery'] }
        })
        .sort({ createdAt: -1 })
        .populate('shopId', 'name image address category isOpen')
        .lean();

        if (!order) {
            return res.status(200).json(null);
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("getActiveOrder error:", error);
        res.status(500).json({ message: "Failed to fetch active order." });
    }
};

module.exports = {
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder,
    getAllOrdersForAdmin,
    getActiveOrder
};