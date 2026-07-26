const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 100 },
  username: { type: String, required: [true, 'Username is required'], unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 30, match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String, trim: true },
  photo: { type: String, default: '' },
  photoPublicId: { type: String },
  bio: { type: String, maxlength: 300 },
  city: { type: String, trim: true },
  company: { type: String, trim: true },
  // UPI Payment fields
  upiId: { type: String, trim: true },
  upiAccountName: { type: String, trim: true },
  preferredUpiApp: {
    type: String,
    enum: ['google_pay', 'phonepe', 'paytm', 'bhim', 'amazon_pay', 'cred', ''],
    default: '',
  },
  upiQR: { type: String },
  // Auth
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  refreshToken: { type: String, select: false },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  pushTokens: [{ type: String }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerifyToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
