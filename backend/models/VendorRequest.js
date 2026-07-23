const mongoose = require('mongoose');

const vendorRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'approved', 'rejected'],
        default: 'pending'
    },
    vendorEmail: {
        type: String,
        trim: true
    },
    shopCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopCategory'
    },
    shopCategory: {
        type: String,
        trim: true
    },
    udyamNumber: {
        type: String,
        trim: true
    },
    shopLat: {
        type: Number
    },
    shopLng: {
        type: Number
    },
    openTime: {
        type: String,
        default: '09:00'
    },
    closeTime: {
        type: String,
        default: '21:00'
    },
    shopImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('VendorRequest', vendorRequestSchema);
