const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { uploadToCloudinary } = require('../middleware/upload');
const { notifyUsers } = require('../utils/notificationHelper');

function calculateSplits(amount, splitType, members, customSplits = []) {
  if (splitType === 'equal') {
    const share = Math.round((amount / members.length) * 100) / 100;
    const remainder = Math.round((amount - share * members.length) * 100) / 100;
    return members.map((userId, i) => ({
      user: userId,
      amount: i === 0 ? share + remainder : share,
      percentage: Math.round((100 / members.length) * 100) / 100,
    }));
  }

  if (splitType === 'percentage') {
    return customSplits.map((s) => ({
      user: s.user,
      amount: Math.round((amount * s.percentage) / 100 * 100) / 100,
      percentage: s.percentage,
    }));
  }

  if (splitType === 'custom') {
    return customSplits.map((s) => ({ user: s.user, amount: s.amount, percentage: Math.round((s.amount / amount) * 100) }));
  }

  return [];
}

// @desc    Add expense
// @route   POST /api/expenses
exports.addExpense = async (req, res, next) => {
  try {
    const { tripId, name, description, amount, category, paidBy, splitType, members, customSplits, date, notes, currency } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    // Validate paidBy is a trip member
    const memberIds = trip.members.map((m) => m.user.toString());
    if (!memberIds.includes(paidBy)) {
      return res.status(400).json({ success: false, message: 'Paid by must be a trip member' });
    }

    // Duplicate detection
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Expense.findOne({
      trip: tripId, name: { $regex: `^${name}$`, $options: 'i' }, amount,
      paidBy, date: { $gte: fiveMinAgo },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Possible duplicate expense detected', duplicateId: duplicate._id });
    }

    const splitMembers = members || memberIds;
    const splits = calculateSplits(parseFloat(amount), splitType, splitMembers, customSplits);

    const expense = await Expense.create({
      trip: tripId, name, description, amount: parseFloat(amount), category, paidBy,
      splitType, splits, date: date || new Date(), notes, currency: currency || trip.currency,
      addedBy: req.user._id,
    });

    // Update trip total
    await Trip.findByIdAndUpdate(tripId, { $inc: { totalExpense: parseFloat(amount) } });

    await expense.populate('paidBy addedBy', 'fullName photo username');

    // Budget alert check
    const updatedTrip = await Trip.findById(tripId);
    if (updatedTrip.budget > 0) {
      const usagePercent = (updatedTrip.totalExpense / updatedTrip.budget) * 100;
      if (usagePercent >= 100) {
        const io = req.app.get('io');
        await notifyUsers(io, memberIds.map((id) => id), {
          type: 'budget_alert', title: '🚨 Budget Exceeded!',
          message: `Trip "${updatedTrip.name}" has exceeded its budget!`, trip: tripId,
        });
      } else if (usagePercent >= 80) {
        const io = req.app.get('io');
        await notifyUsers(io, memberIds.map((id) => id), {
          type: 'budget_alert', title: '⚠️ Budget Alert',
          message: `Trip "${updatedTrip.name}" has used ${Math.round(usagePercent)}% of its budget.`, trip: tripId,
        });
      }
    }

    // Notify members
    const io = req.app.get('io');
    const notifyIds = memberIds.filter((id) => id !== req.user._id.toString());
    await notifyUsers(io, notifyIds, {
      type: 'expense_added', title: 'New Expense Added',
      message: `${req.user.fullName} added "${name}" - ₹${amount}`, expense: expense._id, trip: tripId,
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses for a trip
// @route   GET /api/expenses/trip/:tripId
exports.getTripExpenses = async (req, res, next) => {
  try {
    const { category, paidBy, startDate, endDate, page = 1, limit = 20, search } = req.query;
    const trip = await Trip.findById(req.params.tripId);
    if (!trip || !trip.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const query = { trip: req.params.tripId, isDeleted: false };
    if (category) query.category = category;
    if (paidBy) query.paidBy = paidBy;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.name = { $regex: search, $options: 'i' };

    const expenses = await Expense.find(query)
      .populate('paidBy addedBy', 'fullName photo username')
      .populate('splits.user', 'fullName photo username')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);
    const totalAmount = await Expense.aggregate([
      { $match: { trip: trip._id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true, expenses, total, totalAmount: totalAmount[0]?.total || 0,
      page: parseInt(page), pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy addedBy', 'fullName photo username email')
      .populate('splits.user', 'fullName photo username')
      .populate('trip', 'name currency');
    if (!expense || expense.isDeleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.isDeleted) return res.status(404).json({ success: false, message: 'Expense not found' });

    const trip = await Trip.findById(expense.trip);
    if (!trip.isAdmin(req.user._id) && expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const oldAmount = expense.amount;
    const allowed = ['name', 'description', 'amount', 'category', 'paidBy', 'splitType', 'date', 'notes'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) expense[field] = req.body[field]; });

    if (req.body.members || req.body.customSplits) {
      expense.splits = calculateSplits(expense.amount, expense.splitType, req.body.members, req.body.customSplits);
    }

    await expense.save();

    // Update trip total
    const diff = expense.amount - oldAmount;
    if (diff !== 0) await Trip.findByIdAndUpdate(expense.trip, { $inc: { totalExpense: diff } });

    await expense.populate('paidBy', 'fullName photo');

    const io = req.app.get('io');
    const memberIds = trip.members.map((m) => m.user.toString()).filter((id) => id !== req.user._id.toString());
    await notifyUsers(io, memberIds, {
      type: 'expense_edited', title: 'Expense Updated',
      message: `${req.user.fullName} updated "${expense.name}"`, expense: expense._id, trip: expense.trip,
    });

    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.isDeleted) return res.status(404).json({ success: false, message: 'Expense not found' });

    const trip = await Trip.findById(expense.trip);
    if (!trip.isAdmin(req.user._id) && expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    expense.isDeleted = true;
    await expense.save();
    await Trip.findByIdAndUpdate(expense.trip, { $inc: { totalExpense: -expense.amount } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload receipt
// @route   POST /api/expenses/:id/receipt
exports.uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const result = await uploadToCloudinary(req.file.buffer, 'receipts');
    expense.receipt = result.secure_url;
    expense.receiptPublicId = result.public_id;
    await expense.save();

    res.json({ success: true, receipt: result.secure_url });
  } catch (error) {
    next(error);
  }
};
