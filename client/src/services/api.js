import axios from 'axios';

const defaultApiUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://connectify-9s4e.onrender.com/api'
    : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true,
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking initial session
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/users/profile', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const userAPI = {
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query || '')}`),
  getById: (id) => api.get(`/users/${id}`),
};

export const conversationAPI = {
  getAll: () => api.get('/conversations'),
  create: (data) => api.post('/conversations', data),
  getById: (id) => api.get(`/conversations/${id}`),
  update: (id, data) => api.patch(`/conversations/${id}`, data),
  addMembers: (id, userIds) => api.post(`/conversations/${id}/members`, { userIds }),
  removeMember: (id, userId) => api.delete(`/conversations/${id}/members/${userId}`),
  leave: (id) => api.post(`/conversations/${id}/leave`),
};

export const messageAPI = {
  getByConversation: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  send: (formDataOrData) => {
    if (formDataOrData instanceof FormData) {
      return api.post('/messages', formDataOrData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/messages', formDataOrData);
  },
  edit: (id, text) => api.patch(`/messages/${id}`, { text }),
  delete: (id) => api.delete(`/messages/${id}`),
  markRead: (id) => api.post(`/messages/${id}/read`),
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;
