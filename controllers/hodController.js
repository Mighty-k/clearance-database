const uuid = require('uuid');
const fs = require("fs");
const database = require('../db.json');

exports.addHod = (req, res) => {
  try {
    const {
        department, 
        departmentCode, 
         username,
         fullname,
          email,
         password
    } = req.body;

    if (database.hods.find(hod => hod.department === department)) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const newHod = {
        department, 
        departmentCode, 
         username,
         fullname,
          email,
         password,
      role: "hod",
      id: uuid.v4()
    };

    database.hods.push(newHod);
    // Write to JSON database
    // Assuming your JSON database file is named 'database.json'
    fs.writeFileSync('db.json', JSON.stringify(database, null, 2));

    res.status(201).json(newHod);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
