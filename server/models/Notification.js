const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['expense_added', 'expense_edited', 'expense_deleted', 'member_joined', 'member_removed',
           'payment_requested', 'payment_confirmed', 'payment_rejected', 'trip_updated', 'trip_settled',
           'budget_alert', 'settlement_reminder'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  settlement: { type: mongoose.Schema.Types.ObjectId, ref: 'Settlement' },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
