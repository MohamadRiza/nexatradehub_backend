// ✅ STEP 1: Load .env FIRST — nothing before this!
require('dotenv').config();

// ✅ Optional: Debug log (you can remove later)
console.log('✅ .env loaded | Cloudinary keys:', {
  cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
  api_key: !!process.env.CLOUDINARY_API_KEY,
  api_secret: !!process.env.CLOUDINARY_API_SECRET
});

// ✅ STEP 2: Now import everything else
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const adminAuthRoutes = require('./routes/adminAuth.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const productRoutes = require('./routes/products.routes');

// ✅ These NOW run AFTER dotenv is loaded
const Product = require('./models/Product');
const upload = require('./utils/multer'); // ← Safe now!
const auth = require('./middleware/auth');

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/profile', adminProfileRoutes);

// Admin product upload (protected)
app.post('/api/admin/products', auth, upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category,
      images: req.files.map(file => file.path)
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Product upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public product routes
app.use('/api/products', productRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce Backend is Running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});