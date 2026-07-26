const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/trip/:tripId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
