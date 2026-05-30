const mongoose = require("mongoose");

const masterProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Ek naam ka ek hi global product hoga
    },
    category: {
        type: String,
        required: true,
        default: 'General'
    },
    image: {
        type: String, // Global image link
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('MasterProduct', masterProductSchema);
