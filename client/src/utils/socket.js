import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/uiStore';
import toast from 'react-hot-toast';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

const typeIcons = {
  expense_added: '💸', expense_edited: '✏️', expense_deleted: '🗑️',
  member_joined: '👋', member_removed: '👤', payment_requested: '🔔',
  payment_confirmed: '✅', payment_rejected: '❌', trip_updated: '🗺️',
  budget_alert: '⚠️', settlement_reminder: '💰',
};

export function connectSocket() {
  if (socket?.connected) return socket;

  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return null;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  // Handle real-time notifications
  socket.on('notification', (notification) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification(notification);
    const icon = typeIcons[notification.type] || '📢';
    toast(`${icon} ${notification.title}`, {
      duration: 4000,
      style: {
        background: '#ffffff',
        color: '#1E293B',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        fontSize: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      },
    });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

export function joinTripRoom(tripId) {
  if (socket?.connected) {
    socket.emit('trip:join', tripId);
  }
}

export function leaveTripRoom(tripId) {
  if (socket?.connected) {
    socket.emit('trip:leave', tripId);
  }
}
