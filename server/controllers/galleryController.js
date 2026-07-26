const Gallery = require('../models/Gallery');
const Trip = require('../models/Trip');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { tripId, fileType = 'photo', caption, expenseId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const isVideo = req.file.mimetype.startsWith('video');
    const result = await uploadToCloudinary(req.file.buffer, `gallery/${tripId}`, {
      resource_type: isVideo ? 'video' : 'image',
    });

    const gallery = await Gallery.create({
      trip: tripId, uploadedBy: req.user._id, fileUrl: result.secure_url,
      filePublicId: result.public_id, fileType, caption, expense: expenseId,
      size: req.file.size, mimeType: req.file.mimetype,
    });

    await gallery.populate('uploadedBy', 'fullName photo username');
    res.status(201).json({ success: true, gallery });
  } catch (error) {
    next(error);
  }
};

exports.getTripGallery = async (req, res, next) => {
  try {
    const { fileType, page = 1, limit = 20 } = req.query;
    const trip = await Trip.findById(req.params.tripId);
    if (!trip || !trip.isMember(req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const query = { trip: req.params.tripId };
    if (fileType) query.fileType = fileType;

    const gallery = await Gallery.find(query)
      .populate('uploadedBy', 'fullName photo username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Gallery.countDocuments(query);
    res.json({ success: true, gallery, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (item.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (item.filePublicId) await deleteFromCloudinary(item.filePublicId);
    await item.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
