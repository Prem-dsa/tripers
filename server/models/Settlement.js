const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'requested', 'paid', 'confirmed', 'rejected'], default: 'pending' },
  upiRef: { type: String },
  paymentScreenshot: { type: String },
  requestedAt: { type: Date },
  paidAt: { type: Date },
  confirmedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  notes: { type: String },
}, { timestamps: true });

settlementSchema.index({ trip: 1, from: 1, to: 1 });
settlementSchema.index({ trip: 1, status: 1 });

module.exports = mongoose.model('Settlement', settlementSchema);
