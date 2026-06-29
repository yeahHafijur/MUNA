const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const adminApp = require('../firebaseAdmin');
const { getMessaging } = require('firebase-admin/messaging');
// 1. Get all chat sessions for the logged-in user
const getChatSessions = async (req, res) => {
    try {
        const userId = req.user._id;

        const sessions = await ChatSession.find({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        })
        .populate('buyerId', 'name profilePicture')
        .populate('sellerId', 'name profilePicture')
        .populate('itemId', 'title image')
        .sort({ updatedAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        console.error("getChatSessions Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Start a new chat session (or get existing one)
const startSession = async (req, res) => {
    try {
        const { sellerId, itemId } = req.body;
        const buyerId = req.user._id;

        if (buyerId.toString() === sellerId.toString()) {
            return res.status(400).json({ message: "You cannot chat with yourself." });
        }

        let session = await ChatSession.findOne({ buyerId, sellerId, itemId });

        if (!session) {
            session = await ChatSession.create({
                buyerId,
                sellerId,
                itemId
            });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error("startSession Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Get messages for a specific session
const getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const messages = await ChatMessage.find({ sessionId })
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("getMessages Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Send a new message
const sendMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { text } = req.body;
        const senderId = req.user._id;

        if (!text) {
            return res.status(400).json({ message: "Message text is required." });
        }

        const message = await ChatMessage.create({
            sessionId,
            senderId,
            text
        });

        // Update the session's lastMessage and updatedAt
        const session = await ChatSession.findByIdAndUpdate(sessionId, {
            lastMessage: text,
            updatedAt: new Date()
        });

        res.status(201).json(message);

        // --- FIREBASE PUSH NOTIFICATION ---
        try {
            if (session && adminApp) {
                // Determine recipient
                const recipientId = session.buyerId.toString() === senderId.toString() ? session.sellerId : session.buyerId;
                
                // Fetch recipient's FCM tokens
                const recipient = await User.findById(recipientId).select('fcmTokens');
                
                if (recipient && recipient.fcmTokens && recipient.fcmTokens.length > 0) {
                    const tokens = [...new Set(recipient.fcmTokens)];
                    
                    const messagePayload = {
                        notification: { 
                            title: `New Message from ${req.user.name || 'someone'}`, 
                            body: text 
                        },
                        data: { route: `/chat/${sessionId}` },
                        tokens: tokens,
                    };
            
                    const response = await getMessaging(adminApp).sendEachForMulticast(messagePayload);
                    
                    // Cleanup dead tokens
                    if (response.failureCount > 0) {
                        const failedTokens = [];
                        response.responses.forEach((resp, idx) => {
                            if (!resp.success) {
                                const errCode = resp.error?.code;
                                if (errCode === 'messaging/invalid-registration-token' ||
                                    errCode === 'messaging/registration-token-not-registered') {
                                    failedTokens.push(tokens[idx]);
                                }
                            }
                        });
            
                        if (failedTokens.length > 0) {
                            await User.findByIdAndUpdate(recipientId, {
                                $pull: { fcmTokens: { $in: failedTokens } }
                            });
                        }
                    }
                }
            }
        } catch (fcmError) {
            console.error("FCM Chat Error:", fcmError);
        }

    } catch (error) {
        console.error("sendMessage Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getChatSessions,
    startSession,
    getMessages,
    sendMessage
};
