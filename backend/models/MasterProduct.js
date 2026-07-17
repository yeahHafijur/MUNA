const mongoose = require("mongoose");

const masterProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'General'
    },
    price: {
        type: Number,
        default: 0
    },
    quantity: {
        type: String,
        default: ''
    },
    image: {
        type: String, // Global image link
        default: ''
    },
    gallery: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    }
}, { timestamps: true });

const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);



module.exports = MasterProduct;
