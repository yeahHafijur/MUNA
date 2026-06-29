const express = require('express');
const router = express.Router();
const { getChatSessions, startSession, getMessages, sendMessage, getUnreadCount } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

router.get('/unread-count', getUnreadCount);
router.get('/sessions', getChatSessions);
router.post('/sessions', startSession);
router.get('/sessions/:sessionId/messages', getMessages);
router.post('/sessions/:sessionId/messages', sendMessage);

module.exports = router;
