import axios from 'axios';

// Define API base URL - will use proxy in development
const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API methods for tickets
export const ticketsAPI = {
  // Get all tickets
  getAll: () => api.get('/api/tickets'),
  
  // Get a specific ticket
  getById: (id) => api.get(`/api/tickets/${id}`),
  
  // Submit a new ticket
  create: (ticketData) => api.post('/api/tickets', ticketData),
  
  // Update a ticket
  update: (id, updates) => api.put(`/api/tickets/${id}`, updates),
  
  // Delete a ticket
  delete: (id) => api.delete(`/api/tickets/${id}`),
  
  // Get ticket predictions (AI)
  predict: (text, language = 'en') => 
    api.post('/api/predict', { text, language }),
    
  // Process a batch of tickets
  batch: (tickets) => api.post('/api/tickets/batch', { tickets }),
};

// API methods for authentication
export const authAPI = {
  // Login
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Logout
  logout: () => api.post('/api/auth/logout'),
  
  // Get current user
  getUser: () => api.get('/api/auth/user'),
};

// API methods for admin dashboard
export const adminAPI = {
  // Get dashboard stats
  getStats: () => api.get('/api/admin/stats'),
  
  // Get agents
  getAgents: () => api.get('/api/admin/agents'),
};

export default api; 