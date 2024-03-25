// controllers/studentController.js
const uuid = require('uuid');
const fs = require("fs");
const database = require('../db.json');

exports.addStudent = (req, res) => {
  try {
    const {
      name,
      matricNumber,
      email,
      password,
      department,
      school,
      gender,
      phoneNumber,
      dateOfBirth,
      monthOfGraduation
    } = req.body;

    // Check if matricNumber already exists
    if (database.students.find(student => student.matricNumber === matricNumber)) {
      return res.status(400).json({ message: "Matric number already exists" });
    }

    const newStudent = {
      name,
      matricNumber,
      email,
      password,
      department,
      school,
      gender,
      phoneNumber,
      dateOfBirth,
      monthOfGraduation,
      clearanceRequest: "false",
      "HOD-approval": "pending",
      "BURSARY-approval": "pending",
      "LIBRARY-approval": "pending",
      "BOOKSHOP-approval": "pending",
      "EGWHITE-approval": "pending",
      "BUTH-approval": "pending",
      "ALUMNI-approval": "pending",
      "SECURITY-approval": "pending",
      "VPSD-approval": "pending",
      "REGISTRY-approval": "pending",
      "hodDate":"",
      "bursaryDate":"",
      "libraryDate":"",
     "bookshopDate":"",
     "egwhiteDate":"",
    "buthDate":"",
    "alumniDate":"",
     "securityDate":"",
     "vpsdDate":"",
     "registryDate":"",
      message: "no messages",
      role: "student",
      id: uuid.v4()
    };

    database.students.push(newStudent);
    // Write to JSON database
    // Assuming your JSON database file is named 'database.json'
    fs.writeFileSync('db.json', JSON.stringify(database, null, 2));

    res.status(201).json(newStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
