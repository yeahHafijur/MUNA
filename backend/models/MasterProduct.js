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

// Ensure the old unique index on name is dropped so multiple pending items with the same name can exist
MasterProduct.collection.dropIndex('name_1').catch(err => {
    // Ignore error if index doesn't exist
});

module.exports = MasterProduct;
