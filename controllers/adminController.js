const uuid = require('uuid');
const fs = require("fs");
const database = require('../db.json');

exports.addAdmin = (req, res) => {
  try {
    const {
        username,
        email,
        password,
        fullname,
        department,
    } = req.body;

    // Check if matricNumber already exists
    if (database.admins.find(admin => admin.department === department)) {
      return res.status(400).json({ message: "Officer already exists" });
    }

    const newAdmin = {
        username,
        email,
        password,
        fullname,
        department,
      role: "admin",
      id: uuid.v4()
    };

    database.admins.push(newAdmin);
    // Write to JSON database
    // Assuming your JSON database file is named 'database.json'
    fs.writeFileSync('db.json', JSON.stringify(database, null, 2));

    res.status(201).json(newAdmin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
