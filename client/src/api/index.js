import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

export const userApi = {
  getDashboard: () => api.get('/users/dashboard'),
  getProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadPhoto: (formData) => api.post('/users/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  searchUsers: (q) => api.get(`/users/search?q=${q}`),
  changePassword: (data) => api.put('/users/change-password', data),
};

export const tripApi = {
  create: (data) => api.post('/trips', data),
  getAll: (params) => api.get('/trips', { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  join: (inviteCode) => api.post(`/trips/join/${inviteCode}`),
  addMember: (id, data) => api.post(`/trips/${id}/members`, data),
  removeMember: (id, userId) => api.post(`/trips/${id}/members/remove`, { userId }),
  assignAdmin: (id, userId) => api.post(`/trips/${id}/members/admin`, { userId }),
  uploadCover: (id, formData) => api.post(`/trips/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getQR: (id) => api.get(`/trips/${id}/qr`),
  regenerateInvite: (id) => api.post(`/trips/${id}/regenerate-invite`),
};

export const expenseApi = {
  add: (data) => api.post('/expenses', data),
  getTripExpenses: (tripId, params) => api.get(`/expenses/trip/${tripId}`, { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  uploadReceipt: (id, formData) => api.post(`/expenses/${id}/receipt`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const settlementApi = {
  getTripSettlements: (tripId) => api.get(`/settlements/trip/${tripId}`),
  create: (data) => api.post('/settlements', data),
  request: (id) => api.post(`/settlements/${id}/request`),
  confirm: (id) => api.post(`/settlements/${id}/confirm`),
  reject: (id, reason) => api.post(`/settlements/${id}/reject`, { reason }),
  markPaid: (id, data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post(`/settlements/${id}/mark-paid`, data, config);
  },
  getQR: (id) => api.get(`/settlements/${id}/qr`),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const galleryApi = {
  upload: (formData) => api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTripGallery: (tripId, params) => api.get(`/gallery/trip/${tripId}`, { params }),
  delete: (id) => api.delete(`/gallery/${id}`),
};

export const chatApi = {
  getMessages: (tripId, params) => api.get(`/chat/trip/${tripId}`, { params }),
  deleteMessage: (id) => api.delete(`/chat/${id}`),
};

export const reportApi = {
  getSummary: (tripId) => api.get(`/reports/trip/${tripId}/summary`),
  getExpenses: (tripId, params) => api.get(`/reports/trip/${tripId}/expenses`, { params }),
  getContributions: (tripId) => api.get(`/reports/trip/${tripId}/contributions`),
};
