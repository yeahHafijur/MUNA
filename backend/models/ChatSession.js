const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveBazarItem', // Optional, if they chat about a specific item
    },
    lastMessage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Ensure unique chat session per buyer, seller, and item
chatSessionSchema.index({ buyerId: 1, sellerId: 1, itemId: 1 }, { unique: true });
chatSessionSchema.index({ buyerId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
