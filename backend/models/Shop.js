const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        default: "General"
    },
    shopCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopCategory',
        default: null
    },
    udyamNumber: {
        type: String,
        default: ""
    },
    rating: {
        type: Number,
        default: 0
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    autoSchedule: {
        enabled: { type: Boolean, default: false },
        openTime: { type: String, default: '09:00' }, // HH:mm 24hr format
        closeTime: { type: String, default: '21:00' }, // HH:mm 24hr format
        timezone: { type: String, default: 'Asia/Kolkata' }
    },
    deliverySettings: {
        minOrderAmount: { type: Number, default: 0 }, // Minimum amount for place order
        minimumCharge: { type: Number, default: 0 }, // 1st 1km delivery charges
        minimumDistance: { type: Number, default: 1 }, // distance in km
        chargePerKm: { type: Number, default: 0 }, // charge for extra km
        maxRange: { type: Number, default: 5 } // Max delivery radius in km
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    }
}, { timestamps: true });

shopSchema.index({ isActive: 1, isOpen: 1 });
shopSchema.index({ 'autoSchedule.enabled': 1 });
shopSchema.index({ vendorId: 1 });

module.exports = mongoose.model('Shop', shopSchema);
