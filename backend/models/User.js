const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String
    },
    profilePic: {
        type: String
    },
    role: {
        type: String,
        enum: ['customer', 'vendor', 'super_admin'],
        default: "customer"
    },
    savedLocations: [{
        name: { type: String, required: true }, // 'Home', 'Office'
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    fcmTokens: [{
        type: String
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
});

module.exports = mongoose.model("User", userSchema);
