// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes'); // ← new

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/profile', adminProfileRoutes); // ← protected profile routes

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce Backend is Running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});