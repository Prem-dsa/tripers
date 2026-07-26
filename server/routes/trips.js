const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getTrip, updateTrip, deleteTrip, joinTrip, addMember, removeMember, assignAdmin, uploadCover, getInviteQR, regenerateInvite } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, createTrip);
router.get('/', protect, getTrips);
router.get('/:id', protect, getTrip);
router.put('/:id', protect, updateTrip);
router.delete('/:id', protect, deleteTrip);
router.post('/join/:inviteCode', protect, joinTrip);
router.post('/:id/members', protect, addMember);
router.post('/:id/members/remove', protect, removeMember);
router.post('/:id/members/admin', protect, assignAdmin);
router.post('/:id/cover', protect, upload.single('cover'), uploadCover);
router.get('/:id/qr', protect, getInviteQR);
router.post('/:id/regenerate-invite', protect, regenerateInvite);

module.exports = router;
