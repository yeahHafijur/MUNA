const User = require('../models/User');
const Notification = require('../models/Notification');

let adminApp = null;
let getMessagingFn = null;

try {
    adminApp = require('../firebaseAdmin');
    getMessagingFn = require('firebase-admin/messaging').getMessaging;
} catch (err) {
    console.warn("[NotificationService] Firebase Admin not available. Push notifications disabled.");
}

/**
 * Send Firebase Cloud Messaging push notification with ghost token cleanup.
 * This is a FIRE-AND-FORGET function — it never throws, only logs errors.
 *
 * @param {Array<string>} userIds - MongoDB User IDs to send push to
 * @param {string} heading - Notification title
 * @param {string} message - Notification body
 * @param {string} route - Frontend route to open on click (default "/")
 * @param {Object} androidOptions - Android specific notification options (channelId, sound, etc)
 */
const sendFCMNotification = async (userIds, heading, message, route = "/", androidOptions = null) => {
    if (!adminApp || !getMessagingFn) return console.log("[FCM] ❌ SKIPPED: Firebase Admin not initialized.");
    if (!userIds || userIds.length === 0) return console.log("[FCM] ❌ SKIPPED: No valid User IDs!");

    try {
        const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens').lean();
        let tokens = [];

        users.forEach(user => {
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                tokens = tokens.concat(user.fcmTokens);
            }
        });

        tokens = [...new Set(tokens)]; // Remove duplicates
        if (tokens.length === 0) return console.log(`[FCM] ❌ No FCM tokens found for users: ${userIds}`);

        // FCM limit: max 500 tokens per sendEachForMulticast call
        const BATCH_SIZE = 500;
        const batches = [];
        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            batches.push(tokens.slice(i, i + BATCH_SIZE));
        }

        let totalSuccess = 0;
        let totalFailure = 0;
        const allFailedTokens = [];

        for (const batch of batches) {
            const messagePayload = {
                notification: { title: heading, body: message },
                data: { route: route }, // Frontend ko click karne par kis page par bhejna hai
                tokens: batch,
            };

            if (androidOptions) {
                messagePayload.android = { notification: androidOptions };
            }

            const response = await getMessagingFn(adminApp).sendEachForMulticast(messagePayload);
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;

            // Ghost Token Cleanup
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errCode = resp.error?.code;
                        if (errCode === 'messaging/invalid-registration-token' ||
                            errCode === 'messaging/registration-token-not-registered') {
                            allFailedTokens.push(batch[idx]);
                        }
                    }
                });
            }
        }

        console.log(`[FCM] ✅ Push sent! Success: ${totalSuccess}, Failed: ${totalFailure}`);

        // Clean up dead tokens from DB
        if (allFailedTokens.length > 0) {
            await User.updateMany(
                { _id: { $in: userIds } },
                { $pull: { fcmTokens: { $in: allFailedTokens } } }
            );
            console.log(`[FCM] 🧹 Cleaned up ${allFailedTokens.length} dead tokens from DB.`);
        }
    } catch (error) {
        console.error("[FCM] ❌ Error sending push:", error);
    }
};

/**
 * Send push notification AND save to database.
 * Fire-and-forget — safe to call without await.
 *
 * @param {Array<string>} userIds - MongoDB User IDs
 * @param {string} heading - Notification title
 * @param {string} message - Notification body
 * @param {Object} options - Optional settings
 * @param {string} options.actionUrl - URL to navigate on click (saved in DB)
 * @param {string} options.route - Route for FCM data payload (for service worker click)
 * @param {string} options.type - Notification type: 'order' | 'chat' | 'promo' | 'system' | 'broadcast'
 * @param {Object} options.androidOptions - Android specific push options (channelId, sound)
 */
const sendAndSaveNotification = async (userIds, heading, message, options = {}) => {
    const { actionUrl = "", route = "/", type = "system", androidOptions = null } = options;

    // Fire push notification (don't await — let it run in background)
    sendFCMNotification(userIds, heading, message, route, androidOptions).catch(err => {
        console.error("[NotificationService] FCM push error (background):", err);
    });

    // Save to database
    try {
        const notificationsToInsert = userIds.map(id => ({
            userId: id,
            title: heading,
            message: message,
            actionUrl: actionUrl,
            type: type,
            isRead: false
        }));
        await Notification.insertMany(notificationsToInsert);
        console.log(`[DB] ✅ Saved ${notificationsToInsert.length} notifications to database.`);
    } catch (error) {
        console.error("[DB] ❌ Failed to save notification:", error);
    }
};

/**
 * Remove a specific FCM token from a user's document.
 * Used during logout to prevent stale push notifications.
 *
 * @param {string} userId - MongoDB User ID
 * @param {string} fcmToken - The FCM token to remove
 */
const removeFcmToken = async (userId, fcmToken) => {
    if (!userId || !fcmToken) return;
    try {
        await User.updateOne(
            { _id: userId },
            { $pull: { fcmTokens: fcmToken } }
        );
        console.log(`[FCM] 🧹 Removed FCM token for user ${userId} on logout.`);
    } catch (error) {
        console.error("[FCM] ❌ Error removing FCM token:", error);
    }
};

module.exports = {
    sendFCMNotification,
    sendAndSaveNotification,
    removeFcmToken
};
