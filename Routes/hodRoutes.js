// routes/hodRoutes.js
const express = require('express');
const router = express.Router();
const { addHod } = require('../controllers/hodController');

router.post('/addHods', addHod);

module.exports = router;
