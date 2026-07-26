const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map(); // userId -> socketId

function initSocket(io) {
  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Authenticate socket
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.id;
        onlineUsers.set(decoded.id, socket.id);
        socket.join(`user:${decoded.id}`);
        await User.findByIdAndUpdate(decoded.id, { isOnline: true, lastSeen: new Date() });
        io.emit('user:online', { userId: decoded.id });
      } catch {
        console.log('Socket auth failed');
      }
    }

    // Join trip room
    socket.on('trip:join', (tripId) => {
      socket.join(`trip:${tripId}`);
    });

    // Leave trip room
    socket.on('trip:leave', (tripId) => {
      socket.leave(`trip:${tripId}`);
    });

    // Send chat message
    socket.on('chat:send', async ({ tripId, content, type = 'text', fileUrl, fileType }) => {
      if (!socket.userId) return;
      try {
        const message = await Message.create({
          trip: tripId,
          sender: socket.userId,
          content,
          type,
          fileUrl,
          fileType,
        });
        const populated = await Message.findById(message._id).populate('sender', 'fullName username photo');
        io.to(`trip:${tripId}`).emit('chat:message', populated);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('chat:typing', ({ tripId, isTyping }) => {
      if (!socket.userId) return;
      socket.to(`trip:${tripId}`).emit('chat:typing', { userId: socket.userId, isTyping });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        io.emit('user:offline', { userId: socket.userId });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSocket, onlineUsers };
