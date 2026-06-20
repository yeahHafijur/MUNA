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
    inStock: {
        type: Boolean,
        default: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
        index: true
    }
}, { timestamps: true });

productSchema.index({ shopId: 1, inStock: 1 });
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);