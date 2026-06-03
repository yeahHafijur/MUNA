const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        sparse: true
    },
    email: {
        type: String,
        sparse: true
    },
    googleId: {
        type: String
    },
    profilePic: {
        type: String
    },
    pushSubscription: {
        type: Object,
        default: null
    },
    onesignalPlayerId: {
        type: String,
        default: null
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ['customer', 'vendor', 'super_admin'],
        default: "customer"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("User", userSchema);
