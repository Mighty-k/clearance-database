const express = require("express");
const router = express.Router();

// Import controller functions for user management
const { getAllStudents, getAllAdmins, getAllHODs } = require("../controllers/getall");

// Routes for retrieving all users
router.get("/allStudents", getAllStudents); // Get all student accounts
router.get("/allAdmins", getAllAdmins); // Get all admin accounts
router.get("/allHods", getAllHODs); // Get all HOD accounts

module.exports = router;