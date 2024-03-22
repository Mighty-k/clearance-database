const express = require('express');
const router = express.Router();
const { addStudent } = require('../controllers/studentController');

router.post('/addStudents', addStudent);

module.exports = router;
