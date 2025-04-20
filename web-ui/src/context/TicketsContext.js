import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create context
const TicketsContext = createContext();

// Custom hook to use the tickets context
export const useTickets = () => useContext(TicketsContext);

export const TicketsProvider = ({ children }) => {
  const { getAuthHeader, isAuthenticated, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTickets: 0,
    byCategory: {},
    byPriority: {},
  });

  // Load tickets if authenticated (admin only)
  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  // Fetch all tickets
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get tickets from local storage first (for persistence between refreshes)
      const storedTickets = localStorage.getItem('support_tickets');
      let ticketData = [];
      
      if (storedTickets) {
        ticketData = JSON.parse(storedTickets);
      } else {
        // If no stored tickets, use mock data
        ticketData = [
          {
            ticket_id: 'T1001',
            subject: 'Application keeps crashing',
            text: 'The application keeps crashing when I try to save my work. This is very frustrating as I have lost hours of work.',
            category: 'bug',
            priority: 'critical',
            customer_name: 'John Smith',
            customer_id: 'C12345',
            customer_email: 'john@example.com',
            created_at: '2023-06-10T14:23:45Z',
            status: 'open',
            assigned_to: null
          },
          {
            ticket_id: 'T1002',
            subject: 'How do I export data to PDF?',
            text: 'I need to export my data to PDF format. Where is this option located?',
            category: 'query',
            priority: 'low',
            customer_name: 'Emily Johnson',
            customer_id: 'C45678',
            customer_email: 'emily@example.com',
            created_at: '2023-06-11T09:15:22Z',
            status: 'open',
            assigned_to: null
          },
          {
            ticket_id: 'T1003',
            subject: 'Login page not working in Firefox',
            text: 'I cannot log in when using Firefox browser. The login button does nothing when clicked.',
            category: 'bug',
            priority: 'high',
            customer_name: 'Michael Wong',
            customer_id: 'C98765',
            customer_email: 'michael@example.com',
            created_at: '2023-06-12T16:45:30Z',
            status: 'in_progress',
            assigned_to: 'admin'
          },
          {
            ticket_id: 'T1004',
            subject: 'Feature request: Dark mode',
            text: 'It would be great if you could add a dark mode to reduce eye strain during night usage.',
            category: 'feature',
            priority: 'medium',
            customer_name: 'Sarah Davis',
            customer_id: 'C54321',
            customer_email: 'sarah@example.com',
            created_at: '2023-06-13T11:30:15Z',
            status: 'open',
            assigned_to: null
          },
          {
            ticket_id: 'T1005',
            subject: 'Security vulnerability in password reset',
            text: 'I found a security vulnerability in the password reset functionality. It allows for bypassing email verification.',
            category: 'bug',
            priority: 'critical',
            customer_name: 'Alex Turner',
            customer_id: 'C13579',
            customer_email: 'alex@example.com',
            created_at: '2023-06-14T08:20:10Z',
            status: 'in_progress',
            assigned_to: 'admin'
          },
          // Additional mock tickets for users
          {
            ticket_id: 'T1006',
            subject: 'Cannot update my profile picture',
            text: 'Every time I try to upload a new profile picture, it gives me an error about file size, even with small images.',
            category: 'bug',
            priority: 'medium',
            customer_name: 'Test User',
            customer_id: 'user_1686765432123',
            customer_email: 'test@example.com',
            created_at: '2023-06-15T13:45:12Z',
            status: 'open',
            assigned_to: null
          },
          {
            ticket_id: 'T1007',
            subject: 'App crashes on startup on iPhone 12',
            text: 'After the latest update, the app crashes immediately when I open it on my iPhone 12 with iOS 15.',
            category: 'bug',
            priority: 'high',
            customer_name: 'Test User',
            customer_id: 'user_1686765432123',
            customer_email: 'test@example.com',
            created_at: '2023-06-16T09:12:33Z',
            status: 'in_progress',
            assigned_to: 'admin'
          },
          {
            ticket_id: 'T1008',
            subject: 'Feature request: Export to CSV',
            text: 'Could you add the ability to export data to CSV format? This would help with my data analysis workflow.',
            category: 'feature',
            priority: 'low',
            customer_name: 'Test User',
            customer_id: 'user_1686765432123',
            customer_email: 'test@example.com',
            created_at: '2023-06-17T15:30:25Z',
            status: 'open',
            assigned_to: null
          },
          {
            ticket_id: 'T1009',
            subject: 'Permission issue with shared documents',
            text: 'I cannot access documents that are shared with me by other team members. I get "Access Denied" message.',
            category: 'bug',
            priority: 'high',
            customer_name: 'Admin User',
            customer_id: 'admin001',
            customer_email: 'syntax@team.com',
            created_at: '2023-06-18T10:05:40Z',
            status: 'resolved',
            assigned_to: 'support'
          },
          {
            ticket_id: 'T1010',
            subject: 'Feature request: Calendar integration',
            text: 'It would be helpful to have calendar integration with Google and Outlook for scheduling tasks and reminders.',
            category: 'feature',
            priority: 'medium',
            customer_name: 'Admin User',
            customer_id: 'admin001',
            customer_email: 'syntax@team.com',
            created_at: '2023-06-19T14:22:18Z',
            status: 'open',
            assigned_to: null
          }
        ];
        
        // Store mock tickets in localStorage
        localStorage.setItem('support_tickets', JSON.stringify(ticketData));
      }
      
      setTickets(ticketData);
      
      // Calculate statistics
      calculateStats(ticketData);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate ticket statistics
  const calculateStats = (ticketData) => {
    const total = ticketData.length;
    
    // Count by category
    const categoryCount = ticketData.reduce((acc, ticket) => {
      const category = ticket.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Count by priority
    const priorityCount = ticketData.reduce((acc, ticket) => {
      const priority = ticket.priority || 'unknown';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalTickets: total,
      byCategory: categoryCount,
      byPriority: priorityCount,
    });
  };

  // Submit a new ticket
  const submitTicket = async (ticketData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user information
      const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
      
      // Generate a new ticket ID
      const ticketId = `T${Date.now().toString().substring(6)}`;
      
      // Create the new ticket with current user info
      const newTicket = {
        ticket_id: ticketId,
        subject: ticketData.subject,
        text: ticketData.text,
        category: ticketData.category,
        priority: ticketData.priority || 'medium', // Default priority
        customer_name: userData.name || 'Anonymous User',
        customer_id: userData.id || `user_${Date.now()}`,
        customer_email: userData.email || 'unknown@example.com',
        created_at: new Date().toISOString(),
        status: 'open',
        assigned_to: null
      };
      
      // Add to existing tickets
      const updatedTickets = [...tickets, newTicket];
      
      // Update state
      setTickets(updatedTickets);
      
      // Update localStorage for persistence
      localStorage.setItem('support_tickets', JSON.stringify(updatedTickets));
      
      // Update statistics
      calculateStats(updatedTickets);
      
      // Return the new ticket (as would happen in a real API)
      return newTicket;
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError('Failed to submit ticket. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get a specific ticket
  const getTicket = async (ticketId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Filter from our data
      const ticket = tickets.find(t => t.ticket_id === ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      return ticket;
    } catch (err) {
      console.error(`Error fetching ticket ${ticketId}:`, err);
      setError('Failed to load ticket details. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a ticket
  const updateTicket = async (ticketId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      // Update our local state
      const updatedTickets = tickets.map(ticket => 
        ticket.ticket_id === ticketId ? { ...ticket, ...updates } : ticket
      );
      
      // Update state
      setTickets(updatedTickets);
      
      // Update localStorage for persistence
      localStorage.setItem('support_tickets', JSON.stringify(updatedTickets));
      
      // Update statistics
      calculateStats(updatedTickets);
      
      return { ticket_id: ticketId, ...updates };
    } catch (err) {
      console.error(`Error updating ticket ${ticketId}:`, err);
      setError('Failed to update ticket. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign a ticket
  const assignTicket = async (ticketId, userId) => {
    return updateTicket(ticketId, { 
      assigned_to: userId,
      status: 'in_progress'
    });
  };

  // Context value
  const value = {
    tickets,
    loading,
    error,
    stats,
    fetchTickets,
    submitTicket,
    getTicket,
    updateTicket,
    assignTicket,
  };

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
}; 