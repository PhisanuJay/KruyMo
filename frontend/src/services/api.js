import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kruymo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const userAPI = {
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateAvatar: (id, avatar) => api.post(`/users/${id}/avatar`, { avatar }),
  getAll: () => api.get('/users'),
};

export const costumeAPI = {
  getAll: (params) => api.get('/costumes', { params }),
  get: (id) => api.get(`/costumes/${id}`),
  availability: (id, params) => api.get(`/costumes/${id}/availability`, { params }),
  create: (data) => api.post('/costumes', data),
  update: (id, data) => api.put(`/costumes/${id}`, data),
  delete: (id) => api.delete(`/costumes/${id}`),
};

export const bookingAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  updatePrep: (id, data) => api.patch(`/bookings/${id}/prep`, data),
  pickup: (id) => api.post(`/bookings/${id}/pickup`),
  return: (id, data) => api.post(`/bookings/${id}/return`, data),
  refund: (id) => api.post(`/bookings/${id}/refund`),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  uploadSlip: (bookingId, slipImage) => api.post(`/payments/${bookingId}/slip`, { slipImage }),
  verify: (id, status) => api.patch(`/payments/${id}/verify`, { status }),
};

export const masterDataAPI = {
  universities: {
    getAll: () => api.get('/universities'),
    create: (data) => api.post('/universities', data),
    update: (id, data) => api.put(`/universities/${id}`, data),
    delete: (id) => api.delete(`/universities/${id}`),
  },
  faculties: {
    getAll: (params) => api.get('/faculties', { params }),
    create: (data) => api.post('/faculties', data),
    update: (id, data) => api.put(`/faculties/${id}`, data),
    delete: (id) => api.delete(`/faculties/${id}`),
  },
  sizes: {
    getAll: () => api.get('/sizes'),
    create: (data) => api.post('/sizes', data),
    update: (id, data) => api.put(`/sizes/${id}`, data),
    delete: (id) => api.delete(`/sizes/${id}`),
  },
};

export const reportAPI = {
  revenue: (params) => api.get('/reports/revenue', { params }),
  stock: () => api.get('/reports/stock'),
  dashboard: () => api.get('/reports/dashboard'),
  activityLog: () => api.get('/reports/activity-log'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getTemplates: () => api.get('/notifications/templates'),
  updateTemplates: (data) => api.put('/notifications/templates', data),
};

export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  getIds: () => api.get('/favorites/ids'),
  add: (costumeId) => api.post('/favorites', { costumeId }),
  toggle: (costumeId) => api.post('/favorites/toggle', { costumeId }),
  remove: (costumeId) => api.delete(`/favorites/${costumeId}`),
};

export const cartAPI = {
  getAll: () => api.get('/cart'),
  getCount: () => api.get('/cart/count'),
  add: (data) => api.post('/cart', data),
  update: (id, data) => api.patch(`/cart/${id}`, data),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
  checkout: () => api.post('/cart/checkout'),
};

export const uploadAPI = {
  single: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  multiple: (files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post('/upload/multiple', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default api;
