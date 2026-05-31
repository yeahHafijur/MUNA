const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true
    },
    pushSubscription: {
        type: Object,
        default: null
    },
    email: {
        type: String
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
