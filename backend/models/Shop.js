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
    udyamNumber: {
        type: String,
        default: ""
    },
    customCategories: {
        type: [String],
        default: []
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
        minimumCharge: { type: Number, default: 10 },
        minimumDistance: { type: Number, default: 2 }, // distance in km
        chargePerKm: { type: Number, default: 5 }, // charge for extra km
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

module.exports = mongoose.model('Shop', shopSchema);
