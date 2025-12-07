// routes/vacancies.routes.js
const express = require('express');
const Vacancy = require('../models/Vacancy');
const auth = require('../middleware/auth');

const router = express.Router();

// @desc    Get all active vacancies (Public)
// @route   GET /api/vacancies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const vacancies = await Vacancy.find({ isActive: true }).sort({ createdAt: -1 });
    if (vacancies.length === 0) {
      return res.json([]); // Frontend will show "No vacancies"
    }
    res.json(vacancies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch vacancies' });
  }
});

// @desc    Create new vacancy (Admin only)
// @route   POST /api/admin/vacancies
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const vacancy = new Vacancy({ title, description });
    await vacancy.save();
    res.status(201).json({ success: true, vacancy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update vacancy (Admin only)
// @route   PUT /api/admin/vacancies/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, description, isActive } = req.body;

  try {
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });

    if (title) vacancy.title = title;
    if (description) vacancy.description = description;
    if (typeof isActive === 'boolean') vacancy.isActive = isActive;

    await vacancy.save();
    res.json({ success: true, vacancy });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete vacancy (Admin only)
// @route   DELETE /api/admin/vacancies/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndDelete(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    res.json({ success: true, message: 'Vacancy deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;