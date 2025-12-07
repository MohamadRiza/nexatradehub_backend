// utils/multer.js
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // ← This triggers config

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: file.originalname.split('.')[0] + '_' + Date.now()
    };
  }
});

const upload = require('multer')({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = upload;