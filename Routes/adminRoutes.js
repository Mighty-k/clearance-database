// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { addAdmin } = require('../controllers/adminController');

router.post('/addAdmins', addAdmin);

module.exports = router;
