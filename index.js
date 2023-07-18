
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.Port || 5000

const app = express();
app.use(cors())
app.use(express.json());

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.ab4114m.mongodb.net/?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Model
const userSchema = new mongoose.Schema({
  fullName: String,
  role: String,
  phoneNumber: String,
  email: String,
  password: String,
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

const User = mongoose.model('User', userSchema);


// Registration Route
app.post('/register', async (req, res) => {
  const { fullName, role, phoneNumber, email, password } = req.body;

  // House Model
const houseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    required: true,
  },
  availabilityDate: {
    type: Date,
    required: true,
  },
  rentPerMonth: {
    type: Number,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(\+?88|0088)?0[0-9]{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  description: {
    type: String,
    required: true,
  },
});

const House = mongoose.model('House', houseSchema);

// Add New House Route
app.post('/houses', async (req, res) => {
  try {
    const house = new House(req.body);
    await house.save();
    res.status(201).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Get Owned Houses Route
app.get('/houses', async (req, res) => {
  try {
    const houses = await House.find();
    res.json(houses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Delete House Route
app.delete('/houses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await House.findByIdAndDelete(id);
    res.json({ message: 'House deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update House Route
app.put('/houses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedHouse = await House.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedHouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

  try {

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      fullName,
      role,
      phoneNumber,
      email,
      password,
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'secret-key');

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'secret-key');

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected Route Example
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route accessed' });
});

// JWT Token Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, 'secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  });
}

// Start the server
app.get('/',(req,res)=>{
  res.send('House Rent server is running')
})

app.listen(port,()=>{
  console.log(`House Rent is running port${port}`)
})
