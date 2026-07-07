const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    action: {
        type: String,
        enum: [
            'product_added',
            'product_edited',
            'product_deleted',
            'category_added',
            'category_edited',
            'category_deleted',
            'image_changed'
        ],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    targetName: {
        type: String,
        default: ''
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

auditLogSchema.index({ shopId: 1, timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
