// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Re-check env here too
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('❌ Cloudinary credentials missing in .env');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;