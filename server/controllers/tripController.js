const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const { createNotification, notifyUsers } = require('../utils/notificationHelper');
const { getMemberStats } = require('../utils/settlementAlgorithm');
const QRCode = require('qrcode');

// @desc    Create trip
// @route   POST /api/trips
exports.createTrip = async (req, res, next) => {
  try {
    const { name, destination, description, budget, currency, startDate, endDate, tags } = req.body;

    const trip = await Trip.create({
      name, destination, description, budget, currency, startDate, endDate, tags,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await trip.populate('createdBy', 'fullName photo username');
    await trip.populate('members.user', 'fullName photo username');

    res.status(201).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's trips
// @route   GET /api/trips
exports.getTrips = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = { 'members.user': req.user._id };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const trips = await Trip.find(query)
      .populate('createdBy', 'fullName photo username')
      .populate('members.user', 'fullName photo username')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    // Add expense totals
    const tripIds = trips.map((t) => t._id);
    const expenseTotals = await Expense.aggregate([
      { $match: { trip: { $in: tripIds }, isDeleted: false } },
      { $group: { _id: '$trip', total: { $sum: '$amount' } } },
    ]);
    const totalsMap = {};
    expenseTotals.forEach((e) => { totalsMap[e._id.toString()] = e.total; });

    const tripsWithTotals = trips.map((t) => ({
      ...t.toObject(),
      totalExpense: totalsMap[t._id.toString()] || 0,
    }));

    res.json({ success: true, trips: tripsWithTotals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'fullName photo username email phone')
      .populate('members.user', 'fullName photo username email phone upiId');

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ trip: trip._id, isDeleted: false })
      .populate('paidBy', 'fullName photo')
      .sort({ date: -1 });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Member stats
    const memberStats = trip.members.map((m) => ({
      ...m.toObject ? m.toObject() : m,
      stats: getMemberStats(expenses, m.user._id),
    }));

    res.json({ success: true, trip: { ...trip.toObject(), totalExpense }, memberStats, expenseCount: expenses.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isAdmin(req.user._id)) return res.status(403).json({ success: false, message: 'Admin only' });

    const allowed = ['name', 'destination', 'description', 'budget', 'currency', 'startDate', 'endDate', 'status', 'tags'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) trip[field] = req.body[field]; });
    await trip.save();
    await trip.populate('createdBy members.user', 'fullName photo username');

    const io = req.app.get('io');
    await notifyUsers(io, trip.members.filter((m) => m.user._id.toString() !== req.user._id.toString()).map((m) => m.user._id), {
      type: 'trip_updated', title: 'Trip Updated', message: `${req.user.fullName} updated trip "${trip.name}"`,
      data: { tripId: trip._id }, trip: trip._id,
    });

    res.json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can delete' });
    }
    await Expense.deleteMany({ trip: trip._id });
    await trip.deleteOne();
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Join trip via invite code
// @route   POST /api/trips/join/:inviteCode
exports.joinTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ inviteCode: req.params.inviteCode.toUpperCase() });
    if (!trip) return res.status(404).json({ success: false, message: 'Invalid invite code' });
    if (trip.isMember(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    trip.members.push({ user: req.user._id, role: 'member' });
    await trip.save();
    await trip.populate('members.user', 'fullName photo username');

    const io = req.app.get('io');
    const adminIds = trip.members.filter((m) => m.role === 'admin').map((m) => m.user._id);
    await notifyUsers(io, adminIds, {
      type: 'member_joined', title: 'New Member', message: `${req.user.fullName} joined "${trip.name}"`,
      data: { tripId: trip._id, userId: req.user._id }, trip: trip._id,
    });

    res.json({ success: true, message: `Joined "${trip.name}"!`, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to trip (admin only)
// @route   POST /api/trips/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername) {
      return res.status(400).json({ success: false, message: 'Email or username is required' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    // Verify req.user is admin
    if (!trip.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admins can add members' });
    }

    // Find user by email or username
    const userToAdd = await User.findOne({
      $or: [
        { email: emailOrUsername.trim().toLowerCase() },
        { username: emailOrUsername.trim().toLowerCase() }
      ]
    });

    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already a member
    const alreadyMember = trip.members.some(
      (m) => (m.user._id || m.user).toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this trip' });
    }

    // Add member
    trip.members.push({ user: userToAdd._id, role: 'member' });
    await trip.save();

    await trip.populate('members.user', 'fullName photo username email phone upiId');

    const io = req.app.get('io');
    await createNotification(io, {
      userId: userToAdd._id,
      type: 'member_joined',
      title: 'Joined Trip',
      message: `${req.user.fullName} added you to trip "${trip.name}"`,
      data: { tripId: trip._id },
      trip: trip._id,
    });

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member (admin)
// @route   POST /api/trips/:id/members/remove
exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isAdmin(req.user._id)) return res.status(403).json({ success: false, message: 'Admin only' });
    if (userId === trip.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove trip creator' });
    }

    trip.members = trip.members.filter((m) => m.user.toString() !== userId);
    await trip.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign admin role
// @route   POST /api/trips/:id/members/admin
exports.assignAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isAdmin(req.user._id)) return res.status(403).json({ success: false, message: 'Admin only' });

    const member = trip.members.find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    member.role = 'admin';
    await trip.save();
    res.json({ success: true, message: 'Admin assigned' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload cover image
// @route   POST /api/trips/:id/cover
exports.uploadCover = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isAdmin(req.user._id)) return res.status(403).json({ success: false, message: 'Admin only' });

    if (trip.coverImagePublicId) await deleteFromCloudinary(trip.coverImagePublicId);

    const result = await uploadToCloudinary(req.file.buffer, 'covers', {
      transformation: [{ width: 1200, height: 600, crop: 'fill' }],
    });

    trip.coverImage = result.secure_url;
    trip.coverImagePublicId = result.public_id;
    await trip.save();
    res.json({ success: true, coverImage: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invite QR code
// @route   GET /api/trips/:id/qr
exports.getInviteQR = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const inviteUrl = `${process.env.CLIENT_URL}/join/${trip.inviteCode}`;
    const qrDataUrl = await QRCode.toDataURL(inviteUrl, { width: 300, margin: 2 });
    res.json({ success: true, qrCode: qrDataUrl, inviteUrl, inviteCode: trip.inviteCode });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate invite code
// @route   POST /api/trips/:id/regenerate-invite
exports.regenerateInvite = async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isAdmin(req.user._id)) return res.status(403).json({ success: false, message: 'Admin only' });
    trip.inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    await trip.save();
    res.json({ success: true, inviteCode: trip.inviteCode });
  } catch (error) {
    next(error);
  }
};
