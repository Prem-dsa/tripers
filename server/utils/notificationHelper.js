const Notification = require('../models/Notification');

/**
 * Create a notification and emit it via Socket.io
 */
async function createNotification(io, { userId, type, title, message, data = {}, trip, expense, settlement }) {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      trip,
      expense,
      settlement,
    });

    // Emit real-time notification
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Notification error:', error.message);
  }
}

/**
 * Bulk notify multiple users
 */
async function notifyUsers(io, userIds, notificationData) {
  const promises = userIds.map((userId) =>
    createNotification(io, { userId, ...notificationData })
  );
  return Promise.allSettled(promises);
}

module.exports = { createNotification, notifyUsers };
