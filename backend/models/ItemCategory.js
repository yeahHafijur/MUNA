const mongoose = require("mongoose");

const itemCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    isGlobal: {
        type: Boolean,
        default: false
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Global categories: unique by name where shopId is null
// Per-shop categories: unique by name + shopId
itemCategorySchema.index({ name: 1, shopId: 1 }, { unique: true });
itemCategorySchema.index({ isGlobal: 1 });
itemCategorySchema.index({ vendorId: 1 });

module.exports = mongoose.model('ItemCategory', itemCategorySchema);
