// routes/products.routes.js
const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const upload = require('../utils/multer');

const router = express.Router();

// @desc    Upload new product (Admin only)
// @route   POST /api/admin/products
// @access  Private
router.post(
  '/',
  auth,
  upload.array('images', 4), // Accept up to 4 files, field name = "images"
  async (req, res) => {
    try {
      const { name, description, price, stock, category } = req.body;

      // Validate required fields
      if (!name || !description || !price || !stock || !category) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Ensure at least 1 image was uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'At least one image is required' });
      }

      // Extract Cloudinary URLs
      const imageUrls = req.files.map(file => file.path);

      // Create product
      const product = new Product({
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        images: imageUrls
      });

      await product.save();

      res.status(201).json({
        success: true,
        message: 'Product uploaded successfully',
        product
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during product upload' });
    }
  }
);

// @desc    Get all products (Public)
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// @desc    Get single product (Public)
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;