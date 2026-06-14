const express = require('express');
const router = express.Router();
const { getNavbarMessage, updateNavbarMessage } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to get navbar message
router.get('/navbar-message', getNavbarMessage);

// Protected route (SuperAdmin) to update navbar message
router.put('/navbar-message', protect, admin, updateNavbarMessage);

module.exports = router;
