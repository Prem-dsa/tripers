const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadPhoto, getDashboard, searchUsers, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/dashboard', protect, getDashboard);
router.get('/search', protect, searchUsers);
router.get('/profile/:id', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadPhoto);
router.put('/change-password', protect, changePassword);

module.exports = router;
