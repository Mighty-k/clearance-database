const express = require("express");
const session = require("express-session")
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const bodyParser = require("body-parser");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config()
const { log } = require("console");

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
  // console.log("data: ", JSON.parse(rawData));
  return JSON.parse(rawData);
  
};
// Save data to JSON file
const saveData = (data) => {
  fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
};



// Function to generate OTP
const generateOTP = () => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, 
  auth: {
    user: 'kng.seun1@gmail.com',
    pass: 'q8UG4zMDKXLtsyZP'
  }
});
const sendOTPByEmail = (email, otp) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: '"FYCL" kng.seun1@gmail.com',
      to: email,
      subject: 'OTP for Login',
      text: `Your OTP for login is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};


// Function to save OTP record to JSON database
const saveOTPRecord = (userId, email, OTP) => {
  const data = loadData();
  const timestamp = new Date().getTime();
  const otpRecord = { userId, email, OTP, timestamp };
  data.otpRecords.push(otpRecord);
  saveData(data);
};
const generateOTPAndSendEmail = (userId, email) => {
  const otp = generateOTP(); // Generate OTP
  return sendOTPByEmail(email, otp) // Send OTP via email
    .then(() => {
      // If email sending is successful, save OTP record to the database
      saveOTPRecord(userId, email, otp);
      return { success: true, otp };  // Return OTP for further processing if needed
    })
    .catch(error => {
      console.error('Error sending OTP email:', error);
      throw error; // Propagate the error for handling in the calling function
    });
};

// Function to find OTP record in the JSON database
const findOTPRecord = (email, otp) => {
  const data = loadData(); // Load data from the JSON database
  const otpRecord = data.otpRecords.find(record => record.email === email && record.OTP === otp);
  return otpRecord;
};

// Function to update OTP record in the JSON database
const updateOTPRecordAfterEmail = (userId, email, otp) => {
  // Update OTP record in the database
  const data = loadData(); // Load data from the JSON database
  const otpRecord = data.otpRecords.find(record =>  record.email === email );
  if (otpRecord) {
    otpRecord.OTP = otp;
    otpRecord.timestamp = Date.now(); // Update timestamp
    saveData(data); // Save the updated data to the JSON database
    console.log("OTP record updated successfully after email sending");
  } else {
    console.log("OTP record not found for updating after email sending");
  }
};

const updateOTPAndSendEmail = (userId, email) => {
  const newOtp = generateOTP(); // Generate OTP
  return sendOTPByEmail(email, newOtp) // Send OTP via email
    .then(() => {
      // If email sending is successful, update OTP record in the database
      updateOTPRecordAfterEmail(userId, email, newOtp);
      return { success: true, newOtp }; // Return success status and OTP
    })
    .catch(error => {
      console.error('Error sending OTP email:', error);
      return { success: false, error }; // Return failure status and error message
    });
};

// Function to delete OTP record from the JSON database
const deleteOTPRecord = (email, otp) => {
  const data = loadData(); // Load data from the JSON database
  
  // Find the index of the OTP record to delete
  const index = data.otpRecords.findIndex(record => record.email === email && record.OTP === otp);
  
  // If the OTP record is found, remove it from the array
  if (index !== -1) {
    data.otpRecords.splice(index, 1);
    saveData(data); // Save the updated data to the JSON database
    console.log("OTP record deleted successfully");
  } else {
    console.log("OTP record not found");
  }
};

// Function to get user details by email from the JSON database
const getUserByEmail = (email) => {
  const data = loadData(); // Load data from the JSON database

  if (!data) {
    console.error('Error: Data not loaded');
    return null;
  }

  // Assuming you have users stored in different arrays (students, admins, hods)
  const userTypes = ['students', 'admins', 'hods'];
  
  for (const userType of userTypes) {
    const users = data[userType];
    if (users) {
      const user = users.find(user => user.email === email);
      if (user) {
        return user;
      }
    }
  }
  
  return null; // Return null if user is not found
};


// Function to send OTP via email


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
  req.session.user = user; // Store the entire user object in session
  // Compare passwords  
  if (password !== user.password) {
    return res.status(401).send('Invalid username or password');
  }else if(user.role === 'student'){
    return res.status(200).send({ dashboard: user.role, user });

  }else{
   // Generate OTP, send email, and save OTP record
   generateOTPAndSendEmail(user.id, user.email) // Pass user ID and email to the function
   .then(otp => {
     return res.status(200).send({ dashboard: 'otp', user, otp });
   })
   .catch(error => {
     return res.status(500).send('Error generating OTP and sending email');
   });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  console.log("otp verification: ", req.body);
  // Check if OTP record exists in the database
  const otpRecord = findOTPRecord(email, otp); // Implement this function to find OTP record
  console.log("otp record: ",otpRecord);
  if (otpRecord) {
    // Check if OTP is expired (e.g., 5 minutes expiry time)
    const currentTime = Date.now();
    const otpTimestamp = otpRecord.timestamp;
    const otpExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (currentTime - otpTimestamp <= otpExpiry) {
      // OTP is valid and not expired
      // Delete OTP record from the database
      deleteOTPRecord(email, otp); // Implement this function to delete OTP record
      
      // Get user details based on email (assuming the user is an admin or HOD)
      const user = getUserByEmail(email); // Implement this function to get user details
      
      // Redirect user to their respective dashboard
      return res.status(200).send({ dashboard: user.role, user });
    } else {
      // OTP is expired
      return res.status(401).send({ error: 'OTP expired' });
    }
  } else {
    // OTP is invalid
    return res.status(401).send({ error: 'Invalid OTP' });
  }
});

// Endpoint to regenerate OTP
app.post('/regenerate-otp', (req, res) => {
  const { email } = req.body;

  // Check if the user with the provided email exists among admins or HODs
  const user = admins.find(admin => admin.email === email) || hods.find(hod => hod.email === email);
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }
console.log("user: ",user);
  // Generate a new OTP
 // Generate OTP, send email, and save OTP record
 updateOTPAndSendEmail(user.id, user.email) // Pass user ID and email to the function
 .then(({ success, otp, error }) => {
   if (success) {
     return res.status(200).send({ dashboard: 'otp', user, otp, message: 'Email sent successfully' });
   } else {
     return res.status(500).send('Error generating OTP and sending email');
   }
 });
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

// Function to filter students by admin role

// Route handler for /students
app.get("/students", (req, res) => {
  res.json(students);
});
app.get("/otpRecords", (req, res) => {
  const otpRecords = data.otpRecords;
  res.json(otpRecords);
});

const filterStudentsByAdminRole = (queryParams, students) => {
  console.log("Query Params:", queryParams);
  const { clearanceRequest, adminUsername } = queryParams;
  const admin = admins.find(admin => admin.username === adminUsername);
  console.log("admin:", admin);
  if (!admin) {
    return []; // If admin not found, return empty array
  }

  let filteredStudents = students.filter(student => {
    // Apply filtering based on admin's role and approval statuses
    switch (admin.username.toUpperCase()) {
      case "BURSARY":
        return (
          (student["HOD-approval"] === "approved" && student["BURSARY-approval"] === "pending") ||
          student["BURSARY-approval"] === "approved" || student["BURSARY-approval"] === "rejected" );
      case "LIBRARY":
        return (
          (student["BURSARY-approval"] === "approved" && student["LIBRARY-approval"] === "pending") ||
          student["LIBRARY-approval"] === "approved" || student["LIBRARY-approval"] === "rejected" );
      case "BOOKSHOP":
        return (
          (student["LIBRARY-approval"] === "approved" && student["BOOKSHOP-approval"] === "pending") ||
          student["BOOKSHOP-approval"] === "approved" || student["BOOKSHOP-approval"] === "rejected"       );
      case "EGWHITE":
        return (
          (student["BOOKSHOP-approval"] === "approved" && student["EGWHITE-approval"] === "pending") ||
          student["EGWHITE-approval"] === "approved" || student["EGWHITE-approval"] === "rejected"      );
      case "BUTH":
        return (
          (student["EGWHITE-approval"] === "approved" && student["BUTH-approval"] === "pending") ||
          student["BUTH-approval"] === "approved" || student["BUTH-approval"] === "rejected"   );
      case "ALUMNI":
        return (
          (student["BUTH-approval"] === "approved" && student["ALUMNI-approval"] === "pending") ||
          student["ALUMNI-approval"] === "approved" || student["ALUMNI-approval"] === "rejected"     );
      case "SECURITY":
        return (
          (student["ALUMNI-approval"] === "approved" && student["SECURITY-approval"] === "pending") ||
          student["SECURITY-approval"] === "approved" || student["SECURITY-approval"] === "rejected"       );
      case "VPSD":
        return (
          (student["SECURITY-approval"] === "approved" && student["VPSD-approval"] === "pending") ||
          student["VPSD-approval"] === "approved" || student["VPSD-approval"] === "rejected"   );
      case "REGISTRY":
        return (
          (student["VPSD-approval"] === "approved" && student["REGISTRY-approval"] === "pending") ||
          student["REGISTRY-approval"] === "approved" || student["REGISTRY-approval"] === "rejected"       );
      default:
        return false; // If admin department not found, return false
    }
  });

  // Optionally, filter by clearance request status
  if (clearanceRequest) {
    filteredStudents = filteredStudents.filter(student => student.clearanceRequest === "true");
  }
  console.log("Filtered Students:", filteredStudents);
  return filteredStudents;
};

app.get("/filteredStudents", (req, res) => {
  const { clearanceRequest, adminUsername } = req.query;

  // Call filterStudentsByAdminRole function and pass admin as an argument
  const filteredStudents = filterStudentsByAdminRole({ clearanceRequest, adminUsername }, students);

  res.json(filteredStudents);
});

app.get("/hod/students", (req, res) => {
  const { clearanceRequest, hodApproval, department } = req.query;
  console.log("req_Quer: ", req.query);

  let filteredStudents = students.filter(student => {
    return student.clearanceRequest === (clearanceRequest === "true") && student["HOD-approval"] === hodApproval 
    || student["HOD-approval"] === "rejected" || student["HOD-approval"] === "approved";
  });
  console.log("filtered students hod: ", filteredStudents);
  if (department) {
    filteredStudents = filteredStudents.filter(student => student.department === department);
  }
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

