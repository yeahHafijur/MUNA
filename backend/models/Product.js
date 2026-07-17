const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    image: {
        type: String,
    },
    gallery: [{
        type: String
    }],
    inStock: {
        type: Boolean,
        default: true
    },
    salesCount: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    },
    quantity: {
        type: String,
        default: ''
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    }
}, { timestamps: true });

productSchema.index({ shopId: 1, inStock: 1 });
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);