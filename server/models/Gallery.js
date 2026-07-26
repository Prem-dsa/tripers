const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  filePublicId: { type: String },
  fileType: { type: String, enum: ['photo', 'video', 'receipt', 'document'], default: 'photo' },
  caption: { type: String, maxlength: 300 },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  size: { type: Number },
  mimeType: { type: String },
}, { timestamps: true });

gallerySchema.index({ trip: 1, fileType: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
