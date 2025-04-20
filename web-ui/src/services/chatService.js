import axios from 'axios';

// Define API base URL - will use proxy in development
const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with default config
const chatApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests if available
chatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API methods for chatbot
export const chatService = {
  // Send message to the chat model
  sendMessage: (message, history = []) => 
    chatApi.post('/api/chat', { message, history }),
    
  // Get auto-suggestions based on partial query
  getSuggestions: (partial) => 
    chatApi.get(`/api/chat/suggestions?q=${encodeURIComponent(partial)}`),
    
  // Get knowledge base article based on query
  getKnowledgeArticle: (query) => 
    chatApi.post('/api/knowledge', { query }),
    
  // Rate a bot response
  rateResponse: (messageId, rating) => 
    chatApi.post('/api/chat/feedback', { messageId, rating }),
};

export default chatService; 