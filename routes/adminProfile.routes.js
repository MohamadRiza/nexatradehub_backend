// routes/adminProfile.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth'); // ← your auth middleware

const router = express.Router();

// @desc    Update Admin Username
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
router.put('/', auth, async (req, res) => {
  const { username, currentPassword } = req.body;

  if (!username || !currentPassword) {
    return res.status(400).json({ message: 'Username and current password are required' });
  }

  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new username is already taken (by someone else)
    const existing = await Admin.findOne({ username, _id: { $ne: admin._id } });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    admin.username = username;
    await admin.save();

    res.json({ success: true, message: 'Username updated successfully', username: admin.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update Admin Password
// @route   PUT /api/admin/profile/password
// @access  Private (Admin only)
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;