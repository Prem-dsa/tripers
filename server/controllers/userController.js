const User = require('../models/User');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const { getMemberStats } = require('../utils/settlementAlgorithm');

// @desc    Get user public profile
// @route   GET /api/users/profile/:id
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken -resetPasswordToken -emailVerifyToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tripsCreated = await Trip.countDocuments({ createdBy: user._id });
    const tripsJoined = await Trip.countDocuments({ 'members.user': user._id });
    const expenses = await Expense.find({ paidBy: user._id, isDeleted: false });
    const totalPaid = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      user,
      stats: { tripsCreated, tripsJoined, totalPaid, totalExpenses: expenses.length },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['fullName', 'username', 'phone', 'bio', 'city', 'company', 'upiId', 'upiAccountName', 'preferredUpiApp'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const user = await User.findById(req.user._id);

    // Delete old photo
    if (user.photoPublicId) {
      await deleteFromCloudinary(user.photoPublicId);
    }

    const result = await uploadToCloudinary(req.file.buffer, 'avatars', {
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    user.photo = result.secure_url;
    user.photoPublicId = result.public_id;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, photo: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [tripsCreated, allTrips, recentExpenses, pendingSettlements] = await Promise.all([
      Trip.countDocuments({ createdBy: userId }),
      Trip.find({ 'members.user': userId }).sort({ updatedAt: -1 }).limit(5).populate('createdBy', 'fullName photo'),
      Expense.find({ $or: [{ paidBy: userId }, { 'splits.user': userId }], isDeleted: false })
        .sort({ date: -1 }).limit(10).populate('paidBy', 'fullName photo').populate('trip', 'name'),
      Settlement.find({ $or: [{ from: userId }, { to: userId }], status: { $in: ['pending', 'requested'] } })
        .populate('from to', 'fullName photo').populate('trip', 'name'),
    ]);

    const tripsJoined = allTrips.length;
    const allExpenses = await Expense.find({
      trip: { $in: allTrips.map((t) => t._id) },
      isDeleted: false,
    });

    let totalPaid = 0, totalOwed = 0, totalToReceive = 0;
    allExpenses.forEach((expense) => {
      if (expense.paidBy.toString() === userId.toString()) {
        totalPaid += expense.amount;
      }
      const split = expense.splits.find((s) => s.user.toString() === userId.toString());
      if (split) totalOwed += split.amount;
    });
    totalToReceive = Math.max(0, totalPaid - totalOwed);
    const netBalance = totalPaid - totalOwed;

    // Category breakdown for charts
    const categoryData = {};
    const monthlyData = {};
    allExpenses.forEach((expense) => {
      const split = expense.splits.find((s) => s.user.toString() === userId.toString());
      if (split) {
        categoryData[expense.category] = (categoryData[expense.category] || 0) + split.amount;
        const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + split.amount;
      }
    });

    res.json({
      success: true,
      stats: {
        tripsCreated,
        tripsJoined,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalToReceive: Math.round(totalToReceive * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
        pendingSettlements: pendingSettlements.length,
      },
      recentTrips: allTrips,
      recentExpenses,
      pendingSettlements: pendingSettlements.slice(0, 5),
      charts: { categoryData, monthlyData },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('fullName username email photo').limit(10);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
