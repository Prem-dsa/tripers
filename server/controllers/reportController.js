const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const { getMemberStats, calculateSettlements } = require('../utils/settlementAlgorithm');

exports.getTripSummary = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('createdBy', 'fullName')
      .populate('members.user', 'fullName username email phone photo');
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ trip: trip._id, isDeleted: false })
      .populate('paidBy', 'fullName')
      .populate('splits.user', 'fullName');

    const settlements = await Settlement.find({ trip: trip._id })
      .populate('from to', 'fullName');

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    const memberContributions = trip.members.map((m) => ({
      user: m.user,
      stats: getMemberStats(expenses, m.user._id),
    }));

    const { transactions } = calculateSettlements(expenses, trip.members);

    res.json({
      success: true,
      trip,
      totalExpense,
      expenseCount: expenses.length,
      categoryBreakdown,
      memberContributions,
      expenses,
      settlements,
      recommendedSettlements: transactions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, category, paidBy } = req.query;
    const trip = await Trip.findById(req.params.tripId);
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const query = { trip: trip._id, isDeleted: false };
    if (category) query.category = category;
    if (paidBy) query.paidBy = paidBy;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'fullName')
      .populate('splits.user', 'fullName')
      .sort({ date: -1 });

    res.json({ success: true, expenses, total: expenses.reduce((s, e) => s + e.amount, 0) });
  } catch (error) {
    next(error);
  }
};

exports.getMemberContributions = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'fullName photo username email');
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ trip: trip._id, isDeleted: false });
    const contributions = trip.members.map((m) => ({
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
      stats: getMemberStats(expenses, m.user._id),
    }));

    res.json({ success: true, contributions, totalExpense: expenses.reduce((s, e) => s + e.amount, 0) });
  } catch (error) {
    next(error);
  }
};
