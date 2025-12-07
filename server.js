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
const mongoose = require('mongoose'); // ← ADDED for ObjectId validation
const connectDB = require('./config/db');

// Routes
const adminAuthRoutes = require('./routes/adminAuth.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const productRoutes = require('./routes/products.routes');
const vacancyRoutes = require('./routes/vacancies.routes');

// ✅ These NOW run AFTER dotenv is loaded
const Product = require('./models/Product');
const upload = require('./utils/multer');
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
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/admin/vacancies', auth, vacancyRoutes);

// 🔹 Admin: Upload new product
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

// 🔹 Admin: Update product
app.put('/api/admin/products/:id', auth, upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock, 10);
    if (category) product.category = category;

    // Replace images only if new ones are uploaded
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => file.path);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Admin: Delete product
app.delete('/api/admin/products/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public product routes (GET /api/products and GET /api/products/:id)
app.use('/api/products', productRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce Backend is Running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});