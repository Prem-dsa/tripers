const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const { calculateSettlements, getMemberStats } = require('../utils/settlementAlgorithm');
const { generateUPILink } = require('../utils/upiHelper');
const { createNotification, notifyUsers } = require('../utils/notificationHelper');
const User = require('../models/User');
const QRCode = require('qrcode');

// @desc    Get calculated settlements for a trip
// @route   GET /api/settlements/trip/:tripId
exports.getTripSettlements = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'fullName photo username upiId');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ trip: trip._id, isDeleted: false });

    const { balances, transactions } = calculateSettlements(expenses, trip.members);

    // Enrich transactions with user details
    const usersMap = {};
    trip.members.forEach((m) => { usersMap[m.user._id.toString()] = m.user; });

    const enrichedTransactions = transactions.map((t) => ({
      from: usersMap[t.from],
      to: usersMap[t.to],
      amount: t.amount,
      upiLink: usersMap[t.to]?.upiId
        ? generateUPILink({ upiId: usersMap[t.to].upiId, name: usersMap[t.to].fullName, amount: t.amount, note: `Tripers: +${trip.name}` })
        : null,
    }));

    // Member balances
    const memberBalances = trip.members.map((m) => ({
      user: m.user,
      role: m.role,
      stats: getMemberStats(expenses, m.user._id),
    }));

    // Existing settlement records
    const existingSettlements = await Settlement.find({ trip: trip._id })
      .populate('from to', 'fullName photo username upiId')
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions: enrichedTransactions, memberBalances, existingSettlements });
  } catch (error) {
    next(error);
  }
};

// @desc    Create settlement record
// @route   POST /api/settlements
exports.createSettlement = async (req, res, next) => {
  try {
    const { tripId, toUserId, amount, notes } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const settlement = await Settlement.create({
      trip: tripId, from: req.user._id, to: toUserId, amount, notes, status: 'pending',
    });

    await settlement.populate('from to', 'fullName photo username upiId');
    res.status(201).json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

// @desc    Request payment
// @route   POST /api/settlements/:id/request
exports.requestPayment = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id).populate('from to', 'fullName photo upiId');
    if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });
    if (settlement.to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only receiver can request' });
    }

    settlement.status = 'requested';
    settlement.requestedAt = new Date();
    await settlement.save();

    // Generate UPI link
    const upiLink = settlement.to.upiId
      ? generateUPILink({ upiId: settlement.to.upiId, name: settlement.to.fullName, amount: settlement.amount, note: 'Tripers Settlement' })
      : null;

    // Generate QR
    let qrCode = null;
    if (upiLink) qrCode = await QRCode.toDataURL(upiLink);

    const io = req.app.get('io');
    await createNotification(io, {
      userId: settlement.from._id, type: 'payment_requested', title: 'Payment Requested',
      message: `${settlement.to.fullName} requested ₹${settlement.amount}`, settlement: settlement._id, trip: settlement.trip,
    });

    res.json({ success: true, settlement, upiLink, qrCode });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment received
// @route   POST /api/settlements/:id/confirm
exports.confirmPayment = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id).populate('from to', 'fullName');
    if (!settlement) return res.status(404).json({ success: false, message: 'Not found' });
    if (settlement.to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only receiver can confirm' });
    }

    settlement.status = 'confirmed';
    settlement.confirmedAt = new Date();
    await settlement.save();

    const io = req.app.get('io');
    await createNotification(io, {
      userId: settlement.from._id, type: 'payment_confirmed', title: '✅ Payment Confirmed',
      message: `${settlement.to.fullName} confirmed your payment of ₹${settlement.amount}`,
      settlement: settlement._id, trip: settlement.trip,
    });

    res.json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject payment
// @route   POST /api/settlements/:id/reject
exports.rejectPayment = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id).populate('from to', 'fullName');
    if (!settlement) return res.status(404).json({ success: false, message: 'Not found' });
    if (settlement.to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only receiver can reject' });
    }

    settlement.status = 'rejected';
    settlement.rejectedAt = new Date();
    settlement.rejectionReason = req.body.reason || '';
    await settlement.save();

    const io = req.app.get('io');
    await createNotification(io, {
      userId: settlement.from._id, type: 'payment_rejected', title: '❌ Payment Rejected',
      message: `${settlement.to.fullName} rejected your payment claim`, settlement: settlement._id, trip: settlement.trip,
    });

    res.json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark as paid manually
// @route   POST /api/settlements/:id/mark-paid
exports.markPaid = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ success: false, message: 'Not found' });
    if (settlement.from.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only payer can mark as paid' });
    }

    settlement.status = 'paid';
    settlement.paidAt = new Date();
    if (req.body.upiRef) settlement.upiRef = req.body.upiRef;
    
    // Upload screenshot to Cloudinary if a file was sent
    if (req.file) {
      const { uploadToCloudinary } = require('../middleware/upload');
      const result = await uploadToCloudinary(req.file.buffer, 'settlements');
      settlement.paymentScreenshot = result.secure_url;
    } else if (req.body.paymentScreenshot) {
      settlement.paymentScreenshot = req.body.paymentScreenshot;
    }

    await settlement.save();

    await settlement.populate('from to', 'fullName photo');
    res.json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

// @desc    Get UPI QR for settlement
// @route   GET /api/settlements/:id/qr
exports.getSettlementQR = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id).populate('to', 'fullName upiId');
    if (!settlement) return res.status(404).json({ success: false, message: 'Not found' });

    if (!settlement.to.upiId) return res.status(400).json({ success: false, message: 'Receiver has no UPI ID' });

    const upiLink = generateUPILink({
      upiId: settlement.to.upiId, name: settlement.to.fullName,
      amount: settlement.amount, note: 'Tripers Settlement',
    });
    const qrCode = await QRCode.toDataURL(upiLink);

    res.json({ success: true, qrCode, upiLink });
  } catch (error) {
    next(error);
  }
};
