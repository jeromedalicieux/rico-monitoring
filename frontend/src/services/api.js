import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sites
export const sitesApi = {
  getAll: () => api.get('/sites'),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  getKeywords: (siteId) => api.get(`/sites/${siteId}/keywords`),
  createKeyword: (siteId, keyword) => api.post(`/sites/${siteId}/keywords`, { keyword }),
  updateKeyword: (siteId, keywordId, data) => api.put(`/sites/${siteId}/keywords/${keywordId}`, data),
  deleteKeyword: (siteId, keywordId) => api.delete(`/sites/${siteId}/keywords/${keywordId}`),
};

// Monitoring
export const monitoringApi = {
  runFull: () => api.post('/monitoring/run'),
  runPositions: (siteId) => api.post(`/monitoring/positions/${siteId}`),
  runGMB: (siteId) => api.post(`/monitoring/gmb/${siteId}`),
  runBacklinks: (siteId) => api.post(`/monitoring/backlinks/${siteId}`),
};

// History
export const historyApi = {
  getDashboard: (siteId) => api.get(`/history/dashboard/${siteId}`),
  getPositionHistory: (siteId, params) => api.get(`/history/positions/${siteId}`, { params }),
  comparePositions: (siteId) => api.get(`/history/positions/${siteId}/compare`),
  getGMBHistory: (siteId, params) => api.get(`/history/gmb/${siteId}`, { params }),
  getBacklinksHistory: (siteId) => api.get(`/history/backlinks/${siteId}`),
  getBacklinksByStatus: (siteId, status) => api.get(`/history/backlinks/${siteId}/status/${status}`),
  getBacklinksStats: (siteId) => api.get(`/history/backlinks/${siteId}/stats`),
  getRecentExecutions: (params) => api.get('/history/executions', { params }),
};

// Alerts
export const alertsApi = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: (params) => api.patch('/alerts/read/all', null, { params }),
  delete: (id) => api.delete(`/alerts/${id}`),
  getUnreadCount: (params) => api.get('/alerts/unread/count', { params }),
};

// Changes
export const changesApi = {
  getAll: (params) => api.get('/changes', { params }),
  getStats: (params) => api.get('/changes/stats', { params }),
};

export default api;
