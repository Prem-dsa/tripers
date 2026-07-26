const mongoose = require('mongoose');
const crypto = require('crypto');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  nickname: { type: String },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Trip name is required'], trim: true, maxlength: 100 },
  destination: { type: String, required: [true, 'Destination is required'], trim: true },
  description: { type: String, maxlength: 1000 },
  coverImage: { type: String, default: '' },
  coverImagePublicId: { type: String },
  budget: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'INR' },
  startDate: { type: Date },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  inviteCode: { type: String, unique: true },
  inviteLinkExpiry: { type: Date },
  totalExpense: { type: Number, default: 0 },
  isSettled: { type: Boolean, default: false },
  tags: [{ type: String }],
}, { timestamps: true });

tripSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
  }
  next();
});

tripSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

tripSchema.methods.isMember = function (userId) {
  if (!userId) return false;
  return this.members.some((m) => {
    const mUserId = m.user && (m.user._id || m.user);
    return mUserId && mUserId.toString() === userId.toString();
  });
};

tripSchema.methods.isAdmin = function (userId) {
  if (!userId) return false;
  const creatorId = this.createdBy && (this.createdBy._id || this.createdBy);
  const isCreator = creatorId && creatorId.toString() === userId.toString();
  return this.members.some((m) => {
    const mUserId = m.user && (m.user._id || m.user);
    return mUserId && mUserId.toString() === userId.toString() && m.role === 'admin';
  }) || isCreator;
};

module.exports = mongoose.model('Trip', tripSchema);
