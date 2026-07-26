const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000 },
  type: { type: String, enum: ['text', 'image', 'file', 'system', 'expense_ref', 'settlement_ref'], default: 'text' },
  fileUrl: { type: String },
  fileType: { type: String },
  refId: { type: mongoose.Schema.Types.ObjectId },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ trip: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
