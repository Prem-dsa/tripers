const express = require('express');
const router = express.Router();
const { getTripSummary, getExpenseReport, getMemberContributions } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/trip/:tripId/summary', protect, getTripSummary);
router.get('/trip/:tripId/expenses', protect, getExpenseReport);
router.get('/trip/:tripId/contributions', protect, getMemberContributions);

module.exports = router;
