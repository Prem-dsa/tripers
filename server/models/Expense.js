const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  percentage: { type: Number, min: 0, max: 100 },
  settled: { type: Boolean, default: false },
  settledAt: { type: Date },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: [true, 'Expense name is required'], trim: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
  currency: { type: String, default: 'INR' },
  convertedAmount: { type: Number },
  category: {
    type: String,
    enum: ['hotel', 'food', 'fuel', 'shopping', 'taxi', 'flights', 'train', 'entertainment', 'medical', 'other'],
    default: 'other',
  },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: ['equal', 'percentage', 'custom'], default: 'equal' },
  splits: [splitSchema],
  receipt: { type: String },
  receiptPublicId: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 500 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
}, { timestamps: true });

expenseSchema.index({ trip: 1, date: -1 });
expenseSchema.index({ trip: 1, paidBy: 1 });
expenseSchema.index({ trip: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
