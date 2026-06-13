const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/searchController");

// Public search route
router.get("/", globalSearch);

module.exports = router;
