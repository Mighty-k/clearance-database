const fs = require("fs");

// Controller function to get all student accounts
const getAllStudents = (req, res) => {
  try {
    const data = fs.readFileSync("db.json");
    const { students } = JSON.parse(data);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to get all admin accounts
const getAllAdmins = (req, res) => {
  try {
    const data = fs.readFileSync("db.json");
    const { admins } = JSON.parse(data);
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to get all HOD accounts
const getAllHODs = (req, res) => {
  try {
    const data = fs.readFileSync("db.json");
    const { hods } = JSON.parse(data);
    res.status(200).json(hods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getAllAdmins,
  getAllHODs
};