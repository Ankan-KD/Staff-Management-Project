const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');

// Set strictQuery option to suppress the warning
mongoose.set('strictQuery', false);

// Middleware for serving static files and parsing form data
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Express session setup
app.use(session({
    secret: 'password2004', // Use a secure key here
    resave: false,
    saveUninitialized: true
}));

// Dummy credentials
const users = {
    admin: 'password123',
    admin_2: 'armani'
};

// Middleware to protect routes
function checkAuth(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Root route
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/staff-list');
    } else {
        res.redirect('/login');
    }
});

// Login route
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.loggedIn = true;
        res.redirect('/staff-list');
    } else {
        res.send('Invalid login details');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login'); // Redirects to login page after successful logout
    });
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/staffDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Successfully connected to MongoDB');
}).catch((err) => {
    console.log('MongoDB connection error:', err);
});

// Staff Schema
const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    salary: { type: Number },
    joinDate: { type: Date }
});
const Staff = mongoose.model('Staff', staffSchema);

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Add staff route (protected)
app.get('/add-staff', checkAuth, (req, res) => {
    res.render('addstaff');
});

// Add staff form submission
app.post('/add-staff', async (req, res) => {
    try {
        const { name, position, email, salary, joinDate } = req.body;
        const formattedDate = joinDate ? joinDate.split('/').reverse().join('-') : null;
        const joinDateISO = formattedDate ? new Date(formattedDate) : null;

        const newStaff = new Staff({ name, position, email, salary, joinDate: joinDateISO });
        await newStaff.save();
        res.redirect('/staff-list');
    } catch (err) {
        console.error('Error adding staff:', err.message);
        res.status(400).send('Error adding staff: ' + err.message);
    }
});

// Edit staff route (protected)
app.get('/edit/:id', checkAuth, async (req, res) => {
    try {
        const staffId = req.params.id;
        const staff = await Staff.findById(staffId);

        if (!staff) {
            return res.status(404).send('Staff member not found');
        }

        const formattedJoinDate = staff.joinDate ? staff.joinDate.toISOString().split('T')[0].split('-').reverse().join('/') : '';
        res.render('edit', { staff, formattedJoinDate });
    } catch (err) {
        console.error('Error finding staff member:', err.message);
        res.status(500).send('Internal server error');
    }
});

// Update staff details (protected)
app.put('/edit/:id', checkAuth, async (req, res) => {
    try {
        const { name, position, email, salary, joinDate } = req.body;

        // Check if joinDate is provided and handle if not
        const formattedDate = joinDate ? joinDate.split('/').reverse().join('-') : null;
        const joinDateISO = formattedDate ? new Date(formattedDate) : null;

        // Update the staff member
        await Staff.findByIdAndUpdate(req.params.id, { name, position, email, salary, joinDate: joinDateISO });
        res.redirect('/staff-list');
    } catch (err) {
        console.error('Error updating staff:', err.message);
        res.status(400).send('Error updating staff: ' + err.message);
    }
});

// Delete staff (protected)
app.delete('/delete/:id', checkAuth, async (req, res) => {
    try {
        await Staff.findByIdAndRemove(req.params.id);
        res.redirect('/staff-list');
    } catch (err) {
        console.error('Error deleting staff:', err.message);
        res.status(400).send('Error deleting staff: ' + err.message);
    }
});

// Staff list (protected)
app.get('/staff-list', checkAuth, async (req, res) => {
    try {
        const staffData = await Staff.find();
        res.render('index', { staffData });
    } catch (err) {
        console.error('Error fetching staff data:', err.message);
        res.status(500).send('Error fetching staff data');
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
