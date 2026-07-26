const express = require('express');
const router = express.Router();
const { getTripSettlements, createSettlement, requestPayment, confirmPayment, rejectPayment, markPaid, getSettlementQR } = require('../controllers/settlementController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/trip/:tripId', protect, getTripSettlements);
router.post('/', protect, createSettlement);
router.post('/:id/request', protect, requestPayment);
router.post('/:id/confirm', protect, confirmPayment);
router.post('/:id/reject', protect, rejectPayment);
router.post('/:id/mark-paid', protect, upload.single('screenshot'), markPaid);
router.get('/:id/qr', protect, getSettlementQR);

module.exports = router;
