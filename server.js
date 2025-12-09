// ✅ Load environment variables FIRST
require('dotenv').config();

// Debug logs (optional)
console.log("🔑 GEMINI Key Loaded:", !!process.env.GEMINI_API_KEY);

// Packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// DB connection
const connectDB = require('./config/db');
connectDB();

// Routes
const adminAuthRoutes = require('./routes/adminAuth.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const productRoutes = require('./routes/products.routes');
const vacancyRoutes = require('./routes/vacancies.routes');
const contactRoutes = require('./routes/contact.routes');

// Models & Middleware
const Product = require('./models/Product');
const upload = require('./utils/multer');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Route setup
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/profile', adminProfileRoutes);

app.use('/api/vacancies', vacancyRoutes);
app.use('/api/admin/vacancies', auth, vacancyRoutes);

app.use('/api/contact', contactRoutes);
app.use('/api/admin/contact', auth, contactRoutes);

// ------------------------------------------------------
// PRODUCT CRUD
// ------------------------------------------------------

// Create Product
app.post('/api/admin/products', auth, upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!req.files?.length) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category,
      images: req.files.map(f => f.path)
    });

    res.status(201).json({ success: true, product });

  } catch (error) {
    console.error('Product upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Product
app.put('/api/admin/products/:id', auth, upload.array('images', 4), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid product ID' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, stock, category } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock, 10);
    if (category) product.category = category;

    if (req.files?.length > 0) {
      product.images = req.files.map(f => f.path);
    }

    await product.save();
    res.json({ success: true, product });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Product
app.delete('/api/admin/products/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid product ID' });

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public product routes
app.use('/api/products', productRoutes);

// ------------------------------------------------------
// GEMINI AI ROUTES
// ------------------------------------------------------

// Generate product description
app.post('/api/admin/ai/generate-description', auth, async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    if (!name || !category || price == null || stock == null)
      return res.status(400).json({ message: 'Missing fields' });

    const { generateProductDescription } = require('./utils/gemini');
    const description = await generateProductDescription(name, category, price, stock);

    res.json({ success: true, description });

  } catch (error) {
    console.error('AI description error:', error);
    res.status(500).json({ message: 'Failed to generate description' });
  }
});

// Customer chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: 'Message is required' });

    const { handleCustomerQuery } = require('./utils/gemini');
    const reply = await handleCustomerQuery(message, Product);

    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Chatbot is not available right now.' });
  }
});

// Test
app.get('/', (req, res) => res.json({ message: 'E-Commerce Backend Running ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running → http://localhost:${PORT}`));
