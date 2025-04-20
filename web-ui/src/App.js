import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import SubmitTicket from './pages/SubmitTicket';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetail from './pages/TicketDetail';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';

// Components
import ChatBot from './components/ChatBot';
import Header from './components/Header';

// Context
import { AuthProvider } from './context/AuthContext';
import { TicketsProvider } from './context/TicketsContext';
import { ChatProvider } from './context/ChatContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('auth_token');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  // Check if user is authenticated and is an admin
  const isAuthenticated = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('auth_user');
  let isAdmin = false;
  
  if (isAuthenticated && userData) {
    try {
      const user = JSON.parse(userData);
      isAdmin = user.role === 'admin';
    } catch (e) {
      // Invalid JSON, not admin
    }
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// User check component - redirects based on auth status and role
const AuthRedirect = () => {
  const isAuthenticated = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('auth_user');
  
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  try {
    const user = JSON.parse(userData);
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    // Invalid user data, clear it
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    return <AuthPage />;
  }
};

function App() {
  return (
    <AuthProvider>
      <TicketsProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Routes>
              {/* Landing page - Auth page or redirect based on auth status */}
              <Route path="/" element={<AuthRedirect />} />
              
              {/* Submit ticket page */}
              <Route 
                path="/submit-ticket" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="flex-grow">
                      <SubmitTicket />
                    </main>
                    <ChatBot />
                  </ProtectedRoute>
                } 
              />
              
              {/* User dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="flex-grow">
                      <UserDashboard />
                    </main>
                    <ChatBot />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Header />
                    <main className="flex-grow">
                      <AdminDashboard />
                    </main>
                    <ChatBot />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/tickets/:id" 
                element={
                  <AdminRoute>
                    <Header />
                    <main className="flex-grow">
                      <TicketDetail />
                    </main>
                    <ChatBot />
                  </AdminRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ChatProvider>
      </TicketsProvider>
    </AuthProvider>
  );
}

export default App; 