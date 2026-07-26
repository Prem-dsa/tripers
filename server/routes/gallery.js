const express = require('express');
const router = express.Router();
const { uploadMedia, getTripGallery, deleteMedia } = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, upload.single('file'), uploadMedia);
router.get('/trip/:tripId', protect, getTripGallery);
router.delete('/:id', protect, deleteMedia);

module.exports = router;
