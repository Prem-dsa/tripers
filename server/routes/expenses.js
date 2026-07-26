const express = require('express');
const router = express.Router();
const { addExpense, getTripExpenses, getExpense, updateExpense, deleteExpense, uploadReceipt } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, addExpense);
router.get('/trip/:tripId', protect, getTripExpenses);
router.get('/:id', protect, getExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);
router.post('/:id/receipt', protect, upload.single('receipt'), uploadReceipt);

module.exports = router;
