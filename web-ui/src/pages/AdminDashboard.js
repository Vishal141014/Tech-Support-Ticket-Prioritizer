import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import AdminSidebar from '../components/AdminSidebar';

function AdminDashboard() {
  const { user, logout, generateAdminAccount } = useAuth();
  const { tickets, stats, loading, error, fetchTickets } = useTickets();
  const navigate = useNavigate();
  
  // State for admin generation modal
  const [showModal, setShowModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [generatedAdmin, setGeneratedAdmin] = useState(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refresh tickets on mount
  useEffect(() => {
    fetchTickets();
    // Set periodic refresh
    const interval = setInterval(() => {
      fetchTickets();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchTickets]);
  
  // Apply filters to tickets
  const filteredTickets = tickets.filter(ticket => {
    // Apply category filter
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) {
      return false;
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.text?.toLowerCase().includes(query) ||
        ticket.subject?.toLowerCase().includes(query) ||
        ticket.ticket_id?.toLowerCase().includes(query) ||
        (ticket.customer_name && ticket.customer_name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Handle admin generation
  const handleGenerateAdmin = (e) => {
    e.preventDefault();
    if (!newAdminName) return;
    
    const admin = generateAdminAccount(newAdminName, newAdminRole);
    setGeneratedAdmin(admin);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Get count by priority
  const getCountByPriority = (priority) => {
    return stats.byPriority?.[priority] || 0;
  };
  
  // Get count by category
  const getCountByCategory = (category) => {
    return stats.byCategory?.[category] || 0;
  };
  
  // Get color class for priority
  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get color class for category
  const getCategoryColorClass = (category) => {
    switch (category) {
      case 'bug':
        return 'bg-red-100 text-red-800';
      case 'feature':
        return 'bg-purple-100 text-purple-800';
      case 'query':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1 lg:ml-64"> {/* Add margin to account for sidebar width */}
        {/* Dashboard header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 ml-8 lg:ml-0">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 ml-2">Manage support tickets and staff</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Add Admin
                </button>
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Tickets</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTickets || 0}</p>
              <div className="h-1 w-full bg-blue-100 rounded-full mt-2 mb-1">
                <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">All tickets in the system</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Critical Priority</h3>
              <p className="text-3xl font-bold text-red-600">{getCountByPriority('critical') || 0}</p>
              <div className="h-1 w-full bg-red-100 rounded-full mt-2 mb-1">
                <div 
                  className="h-1 bg-red-500 rounded-full" 
                  style={{ width: `${stats.totalTickets ? (getCountByPriority('critical') / stats.totalTickets) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">Requiring immediate attention</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Bug Reports</h3>
              <p className="text-3xl font-bold text-orange-600">{getCountByCategory('bug') || 0}</p>
              <div className="h-1 w-full bg-orange-100 rounded-full mt-2 mb-1">
                <div 
                  className="h-1 bg-orange-500 rounded-full" 
                  style={{ width: `${stats.totalTickets ? (getCountByCategory('bug') / stats.totalTickets) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">Technical issues reported</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Feature Requests</h3>
              <p className="text-3xl font-bold text-purple-600">{getCountByCategory('feature') || 0}</p>
              <div className="h-1 w-full bg-purple-100 rounded-full mt-2 mb-1">
                <div 
                  className="h-1 bg-purple-500 rounded-full" 
                  style={{ width: `${stats.totalTickets ? (getCountByCategory('feature') / stats.totalTickets) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">New functionality suggestions</p>
            </div>
          </div>
          
          {/* AI Insights */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-4">
            <div className="flex items-center mb-2">
              <img src="/images/syntax_samurai_logo.svg" alt="AI" className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold text-blue-900">AI Insights</h2>
            </div>
            <p className="text-sm text-blue-800 mb-2">
              {stats.totalTickets > 0 ? (
                <>
                  Based on the current ticket distribution, we recommend focusing on 
                  {getCountByPriority('critical') > 2 ? (
                    <span className="font-semibold"> critical bugs </span>
                  ) : getCountByPriority('high') > getCountByPriority('medium') ? (
                    <span className="font-semibold"> high priority items </span>
                  ) : (
                    <span className="font-semibold"> addressing feature requests </span>
                  )}
                  first. There are currently 
                  <span className="font-semibold"> {getCountByPriority('critical') || 0} critical </span> and 
                  <span className="font-semibold"> {getCountByPriority('high') || 0} high </span> 
                  priority tickets that need attention.
                </>
              ) : (
                "No tickets in the system to analyze yet. Submit some tickets to see AI-powered insights."
              )}
            </p>
          </div>
          
          {/* Filters and search */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-wrap md:flex-nowrap gap-4">
              <div className="w-full md:w-auto">
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="query">Query</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div className="w-full md:w-auto">
                <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="w-full md:w-auto">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="w-full md:flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Tickets list */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3">Support Tickets</h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                  <p className="mt-1 text-sm text-gray-500">{searchQuery || categoryFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all" ? "Try changing your filters" : "There are no tickets in the system"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{ticket.ticket_id}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.subject}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColorClass(ticket.category)}`}>
                              {ticket.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClass(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status || 'open')}`}>
                              {ticket.status || 'open'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{ticket.customer_name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500">{ticket.customer_id || 'No ID'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/admin/tickets/${ticket.ticket_id}`} className="text-blue-600 hover:text-blue-900">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Admin generation modal */}
        {showModal && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Generate Admin Account
                      </h3>
                      
                      {generatedAdmin ? (
                        <div className="mt-4">
                          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-green-800">
                                  Admin account generated successfully!
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Admin Credentials</h4>
                            <p className="text-sm mb-1"><span className="font-medium">ID:</span> {generatedAdmin.id}</p>
                            <p className="text-sm mb-1"><span className="font-medium">Name:</span> {generatedAdmin.name}</p>
                            <p className="text-sm mb-1"><span className="font-medium">Role:</span> {generatedAdmin.role}</p>
                            <p className="text-sm"><span className="font-medium">Password:</span> {generatedAdmin.password}</p>
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            Store these credentials in a secure location. The password cannot be retrieved later.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleGenerateAdmin}>
                          <div className="mb-4">
                            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1">
                              Admin Name
                            </label>
                            <input
                              type="text"
                              id="adminName"
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter admin name"
                              required
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="adminRole" className="block text-sm font-medium text-gray-700 mb-1">
                              Admin Role
                            </label>
                            <select
                              id="adminRole"
                              value={newAdminRole}
                              onChange={(e) => setNewAdminRole(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="admin">System Admin</option>
                              <option value="manager">Support Manager</option>
                            </select>
                          </div>
                          
                          <button
                            type="submit"
                            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Generate Admin Account
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setGeneratedAdmin(null);
                      setNewAdminName('');
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 