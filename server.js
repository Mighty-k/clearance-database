const express = require("express");
const session = require("express-session")
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

const dbFilePath = 'db.json';

// Load data from the JSON database
const data = fs.readFileSync(dbFilePath);
const { students, admins, hods } = JSON.parse(data);

// Middleware to handle CORS (if needed)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
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

// Authentication route
app.post('/login', (req, res) => {
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
  if (password !== user.password) {
    return res.status(401).send('Invalid username or password');
  }

  req.session.user = user; // Store the entire user object in session
  
  res.status(200).send({ dashboard: user.role, user: user }); // Return user object along with the role
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(); // Destroy the session to clear user data
  res.status(200).send('Logout successful');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.userRole) {
    return res.status(403).send('Unauthorized');
  }
  // Check user role from session and send appropriate dashboard data
  const userRole = req.session.userRole;
  // Return dashboard data based on user role
  if (userRole === 'student') {
    res.json({ dashboard: 'student'});
    console.log('User Role:', req.session.userRole); // Log user role
  } else if (userRole === 'admin') {
    res.json({ dashboard: 'admin' });
    console.log('User Role:', req.session.userRole);
  } else if (userRole === 'hod') {
    res.json({ dashboard: 'hod' });
    console.log('User Role:', req.session.userRole);
  } else {
    res.status(403).send('Unauthorized');
  }
});



//route for root
app.get("/", (req, res) => {
    res.send("Welcome to the root endpoint!");
  });  

// Routes for handling students
app.get("/students", (req, res) => {
  const { clearanceRequest } = req.query;

  // Filter students based on clearance request
  let filteredStudents = students.filter(student => student.clearanceRequest === "true");

  // Loop through each admin to filter based on department approval status
  admins.forEach(admin => {
    // Check if the admin's approval status is 'approved'
    if (admin[`${admin.username.toUpperCase()}-approval`] === "approved") {
      // Filter students based on the approval status of the corresponding department
      filteredStudents = filteredStudents.filter(student => student[`${admin.department.toUpperCase()}-approval`] === "pending");
    }
  });

  res.json(filteredStudents);
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

// Update student data by ID
app.patch("/students/:id", (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const data = loadData();

  // Find the index of the student with the provided ID
  const index = data.students.findIndex((student) => student.id === id);

  // If the student is found, update their data
  if (index !== -1) {
    data.students[index] = { ...data.students[index], ...body };
    saveData(data);
    res.json(data.students[index]);
  } else {
    // If the student is not found, return a 404 error
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
// filtering students by admins
const filterStudentsByAdminRole = (queryParams, admins, students) => {
  const { clearanceRequest } = queryParams;
  const admin = admins.find(admin => admin.username === queryParams.adminUsername);
  if (!admin) {
    return []; // If admin not found, return empty array
  }
  
  let filteredStudents = students.filter(student => {
    // Apply filtering based on admin's role and approval statuses
    switch (admin.username.toUpperCase()) {
      case "BURSARY":
        return (student.HOD-approval === "approved" && student.BURSARY-approval === "pending") ||
               student.BURSARY-approval === "approved" || student.BURSARY-approval === "rejected";
      case "LIBRARY":
        return (student.BURSARY-approval === "approved" && student.LIBRARY-approval === "pending") ||
               student.LIBRARY-approval === "approved" || student.LIBRARY-approval === "rejected";
      case "BOOKSHOP":
        return (student.LIBRARY-approval === "approved" && student.BOOKSHOP-approval === "pending") ||
               student.BOOKSHOP-approval === "approved" || student.BOOKSHOP-approval === "rejected";
      case "EGWHITE":
        return (student.BOOKSHOP-approval === "approved" && student.EGWHITE-approval === "pending"  ) ||
               student.EGWHITE-approval === "approved" || student.EGWHITE-approval === "rejected";
      case "BUTH":
        return (student.EGWHITE-approval === "approved" && student.BUTH-approval === "pending") ||
               student.BUTH-approval === "approved" || student.BUTH-approval === "rejected";
      case "ALUMNI":
        return (student.BUTH-approval === "approved" && student.ALUMNI-approval === "pending") ||
               student.ALUMNI-approval === "approved" || student.ALUMNI-approval === "rejected";
      case "SECURITY":
        return (student.ALUMNI-approval === "approved" && student.SECURITY-approval === "pending") ||
               student.SECURITY-approval === "approved" || student.SECURITY-approval === "rejected";
      case "VPSD":
        return (student.SECURITY-approval === "approved" && student.VPSD-approval === "pending") ||
               student.VPSD-approval === "approved" || student.VPSD-approval === "rejected";
      case "REGISTRY":
        return (student.VPSD-approval === "approved" && student.REGISTRY-approval === "pending") ||
               student.REGISTRY-approval === "approved" || student.REGISTRY-approval === "rejected";
      
      default:
        return false; // If admin role not found, return false
    }
  });

  // Optionally, filter by clearance request status
  if (clearanceRequest) {
    filteredStudents = filteredStudents.filter(student => student.clearanceRequest === true);
  }

  return filteredStudents;
};


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

