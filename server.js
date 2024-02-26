const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

// Middleware to handle CORS (if needed)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Load data from JSON file
const loadData = () => {
  const rawData = fs.readFileSync("db.json");
  return JSON.parse(rawData);
};

// Save data to JSON file
const saveData = (data) => {
  fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
};

// Routes for handling students
app.get("/students", (req, res) => {
  const data = loadData();
  res.json(data.students);
});

app.get("/students/:id", (req, res) => {
  const data = loadData();
  const student = data.students.find((s) => s.id === req.params.id);
  if (student) {
    res.json(student);
  } else {
    res.status(404).json({ message: "Student not found" });
  }
});

app.post("/students", (req, res) => {
  const data = loadData();
  const newStudent = req.body;
  newStudent.id = Math.random().toString(36).substr(2, 9); // Generate a random ID (not suitable for production)
  data.students.push(newStudent);
  saveData(data);
  res.status(201).json(newStudent);
});

app.put("/students/:id", (req, res) => {
  const data = loadData();
  const index = data.students.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    data.students[index] = { ...data.students[index], ...req.body };
    saveData(data);
    res.json(data.students[index]);
  } else {
    res.status(404).json({ message: "Student not found" });
  }
});

app.delete("/students/:id", (req, res) => {
  const data = loadData();
  const index = data.students.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    const deletedStudent = data.students.splice(index, 1)[0];
    saveData(data);
    res.json(deletedStudent);
  } else {
    res.status(404).json({ message: "Student not found" });
  }
});

// Routes for handling admins
app.get("/admins", (req, res) => {
  const data = loadData();
  res.json(data.admins);
});

app.get("/admins/:id", (req, res) => {
  const data = loadData();
  const admin = data.admins.find((a) => a.id === req.params.id);
  if (admin) {
    res.json(admin);
  } else {
    res.status(404).json({ message: "Admin not found" });
  }
});

// Routes for handling HODs
app.get("/hods", (req, res) => {
  const data = loadData();
  res.json(data.hods);
});

app.get("/hods/:department", (req, res) => {
  const data = loadData();
  const hod = data.hods.find((h) => h.department === req.params.department);
  if (hod) {
    res.json(hod);
  } else {
    res.status(404).json({ message: "HOD not found" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
