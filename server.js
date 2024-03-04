const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

const dbFilePath = './database.json';

// Load data from the JSON database
const data = fs.readFileSync(dbFilePath);
const { students, admins, hods } = JSON.parse(data);

// Authentication route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  let user = null;

  // Check if the username starts with "hod_"
  if (username.startsWith('hod_')) {
    user = hods.find(hod => hod.username === username);
  } else if (username.includes('/')) {
    user = students.find(student => student.matricNumber === username);
  } else {
    user = admins.find(admin => admin.username === username);
  }

  // Check if user exists
  if (!user) {
    return res.status(401).send('Invalid username or password');
  }

  // Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).send('Invalid username or password');
  }

  // Store user role in session
  req.session.userRole = user.role; // assuming role is stored in user data

  res.status(200).send('Login successful');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  // Check user role from session and send appropriate dashboard data
  const userRole = req.session.userRole;
  // Return dashboard data based on user role
  // Example:
  if (userRole === 'student') {
    res.json({ dashboard: 'student-dashboard' });
  } else if (userRole === 'admin') {
    res.json({ dashboard: 'admin' });
  } else if (userRole === 'hod') {
    res.json({ dashboard: 'hod' });
  } else {
    res.status(403).send('Unauthorized');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
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

//route for root
app.get("/", (req, res) => {
    res.send("Welcome to the root endpoint!");
  });  

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
