const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // 1. Order kisne kiya?
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 2. Kis dukan se kiya? (Single Shop rule ke liye zaruri hai)
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    },
    // 3. Kya kya order kiya? (Items ka array)
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    // 4. Total bill kitna hua?
    totalAmount: {
        type: Number,
        required: true
    },
    // Delivery fee separate tracking ke liye
    deliveryFee: {
        type: Number,
        default: 0
    },
    // 5. Delivery Location (Customer ka pata aur lat/lng)
    deliveryLocation: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    // 6. Order ka current status kya hai?
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
        index: true
    },
    // 7. Payment status
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    // 8. Customer Instructions
    instructions: {
        type: String,
        default: ''
    },
    // Delivery Security PIN (OTP)
    deliveryOtp: {
        type: String,
        required: true
    },
    // Brute-force protection for the delivery PIN
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLockedUntil: {
        type: Date,
        default: null
    }
}, { timestamps: true });

orderSchema.index({ customerId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);