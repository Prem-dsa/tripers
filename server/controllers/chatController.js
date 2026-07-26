const Message = require('../models/Message');
const Trip = require('../models/Trip');

exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const trip = await Trip.findById(req.params.tripId);
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const messages = await Message.find({ trip: req.params.tripId, isDeleted: false })
      .populate('sender', 'fullName photo username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark as read
    await Message.updateMany(
      { trip: req.params.tripId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages: messages.reverse(), page: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
