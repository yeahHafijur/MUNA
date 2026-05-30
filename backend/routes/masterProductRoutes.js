const express = require('express');
const router = express.Router();
const { getAllMasterProducts } = require('../controllers/masterProductController');

// GET /api/master-products
router.get('/', getAllMasterProducts);

module.exports = router;
