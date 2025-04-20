import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center">
              <img 
                src="/images/syntax_samurai_logo.svg" 
                alt="Syntax Samurai Logo" 
                className="h-12 w-12 mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SYNTAX SAMURAI</h1>
                <p className="text-sm text-gray-600">CUSTOMER SUPPORT DIVISION</p>
              </div>
            </Link>
          </div>
          
          {/* Navigation links */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User navigation */}
                {user?.role !== 'admin' && (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Tickets
                    </Link>
                    <Link 
                      to="/submit-ticket" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Submit Ticket
                    </Link>
                  </>
                )}
                
                {/* Admin navigation */}
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                {/* User info and logout */}
                <div className="pl-3 border-l border-gray-300">
                  <span className="text-sm text-gray-600 mr-3">
                    Hello, {user?.name || 'User'}
                  </span>
                  
                  <button
                    onClick={logout}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 