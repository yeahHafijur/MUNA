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
