import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTickets } from './TicketsContext';

// Create context
const ChatContext = createContext();

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);

// Knowledge base for the chatbot
const KNOWLEDGE_BASE = {
  greetings: [
    "Hello! I'm your Syntax Samurai support assistant. How can I help you with your tech issue today?",
    "Hi there! I'm the Syntax Samurai AI assistant. What tech support do you need?",
    "Welcome to Syntax Samurai support! I'm here to assist with your technical questions."
  ],
  fallbacks: [
    "I'm not sure I understand. Could you provide more details about your issue?",
    "I'd like to help, but I need more information. Could you elaborate on your problem?",
    "I'm having trouble understanding your request. Can you describe the issue differently?"
  ],
  common_solutions: {
    login: [
      "If you're having login issues, try clearing your browser cache and cookies.",
      "For login problems, make sure Caps Lock is off and your username/password are correct.",
      "Try resetting your password using the 'Forgot Password' link on the login page."
    ],
    crash: [
      "Application crashes are often resolved by restarting the application or your device.",
      "Try updating to the latest version of the software to fix crash issues.",
      "Check if your system meets the minimum requirements for running the application."
    ],
    performance: [
      "Slow performance can be improved by closing other applications that consume resources.",
      "Try clearing temporary files and cache to improve performance.",
      "Consider upgrading your hardware if you're experiencing persistent performance issues."
    ],
    data_loss: [
      "Check if there's an autosave feature that might have preserved your work.",
      "Look for backup files that may have been created automatically.",
      "In the future, consider enabling regular backups to prevent data loss."
    ],
    installation: [
      "Make sure your system meets the minimum requirements before installation.",
      "Try running the installer as administrator if you're having permission issues.",
      "Temporarily disable antivirus software during installation if it's blocking the process."
    ],
    update: [
      "Ensure you have a stable internet connection when updating.",
      "If updates fail, try downloading the update package directly from our website.",
      "Make sure you have enough disk space for the update to be installed."
    ]
  }
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { tickets, submitTicket } = useTickets();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(true);
  const [pendingTicket, setPendingTicket] = useState(null);

  // Initial greeting message
  useEffect(() => {
    // Add initial bot message with slight delay to simulate bot thinking
    const timer = setTimeout(() => {
      const randomGreeting = KNOWLEDGE_BASE.greetings[
        Math.floor(Math.random() * KNOWLEDGE_BASE.greetings.length)
      ];
      
      setMessages([
        {
          id: `welcome_${Date.now()}`,
          text: randomGreeting,
          sender: 'bot',
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Analyze message to determine intent
  const analyzeMessage = (text) => {
    const lowerText = text.toLowerCase();
    
    // Basic intent detection
    let intent = 'general_query';
    let category = 'query';
    let priority = 'low';
    
    // Check for login/authentication issues
    if (
      lowerText.includes('login') || 
      lowerText.includes('password') || 
      lowerText.includes('sign in') || 
      lowerText.includes('authentication') ||
      lowerText.includes('account')
    ) {
      intent = 'login_issue';
      category = 'bug';
      priority = 'medium';
    }
    
    // Check for crashes/errors
    else if (
      lowerText.includes('crash') || 
      lowerText.includes('error') || 
      lowerText.includes('freeze') || 
      lowerText.includes('not working') ||
      lowerText.includes('broken')
    ) {
      intent = 'crash_issue';
      category = 'bug';
      priority = 'high';
      
      // Critical if affecting work or multiple users
      if (
        lowerText.includes('everyone') || 
        lowerText.includes('all users') || 
        lowerText.includes('production') || 
        lowerText.includes('can\'t work') ||
        lowerText.includes('lost work')
      ) {
        priority = 'critical';
      }
    }
    
    // Check for performance issues
    else if (
      lowerText.includes('slow') || 
      lowerText.includes('performance') || 
      lowerText.includes('lag') || 
      lowerText.includes('takes forever') ||
      lowerText.includes('loading')
    ) {
      intent = 'performance_issue';
      category = 'bug';
      priority = 'medium';
    }
    
    // Check for data loss
    else if (
      lowerText.includes('lost data') || 
      lowerText.includes('missing files') || 
      lowerText.includes('deleted') || 
      lowerText.includes('gone') ||
      lowerText.includes('disappeared')
    ) {
      intent = 'data_loss';
      category = 'bug';
      priority = 'high';
    }
    
    // Check for installation issues
    else if (
      lowerText.includes('install') || 
      lowerText.includes('setup') || 
      lowerText.includes('download') || 
      lowerText.includes('update')
    ) {
      intent = 'installation_issue';
      category = 'query';
      priority = 'medium';
    }
    
    // Check for feature requests
    else if (
      lowerText.includes('feature') || 
      lowerText.includes('add') || 
      lowerText.includes('would be nice') || 
      lowerText.includes('should have') ||
      lowerText.includes('could you implement')
    ) {
      intent = 'feature_request';
      category = 'feature';
      priority = 'low';
    }
    
    // Check for similar tickets
    const similarTickets = tickets.filter(ticket => {
      const ticketText = (ticket.subject + ' ' + ticket.text).toLowerCase();
      
      // Check for keyword overlap
      const words = lowerText.split(/\s+/);
      let matches = 0;
      
      words.forEach(word => {
        if (word.length > 3 && ticketText.includes(word)) {
          matches++;
        }
      });
      
      return matches >= 2; // At least 2 significant word matches
    });
    
    return {
      intent,
      category,
      priority,
      similarTickets: similarTickets.slice(0, 3) // Top 3 similar tickets
    };
  };

  // Generate response based on analysis
  const generateResponse = (analysis, userMessage) => {
    const { intent, category, priority, similarTickets } = analysis;
    
    // Check if we have similar tickets
    let response = "";
    let suggestions = [];
    let createTicket = false;
    
    if (similarTickets.length > 0) {
      response = "I found some similar issues in our system. ";
      
      if (similarTickets.some(t => t.status === 'resolved')) {
        const resolvedTicket = similarTickets.find(t => t.status === 'resolved');
        response += `We've actually resolved a similar issue before. The solution was related to "${resolvedTicket.subject}". `;
      } else if (similarTickets.some(t => t.status === 'in_progress')) {
        response += "Our team is currently working on similar issues. ";
      }
    }
    
    // Add intent-specific responses
    switch (intent) {
      case 'login_issue':
        response += KNOWLEDGE_BASE.common_solutions.login[
          Math.floor(Math.random() * KNOWLEDGE_BASE.common_solutions.login.length)
        ];
        suggestions = ["Reset password", "Clear browser cache", "Try a different browser"];
        break;
        
      case 'crash_issue':
        response += KNOWLEDGE_BASE.common_solutions.crash[
          Math.floor(Math.random() * KNOWLEDGE_BASE.common_solutions.crash.length)
        ];
        suggestions = ["Restart application", "Update to latest version", "Check system requirements"];
        createTicket = priority === 'critical' || priority === 'high';
        break;
        
      case 'performance_issue':
        response += KNOWLEDGE_BASE.common_solutions.performance[
          Math.floor(Math.random() * KNOWLEDGE_BASE.common_solutions.performance.length)
        ];
        suggestions = ["Close other applications", "Clear cache", "Check for updates"];
        break;
        
      case 'data_loss':
        response += KNOWLEDGE_BASE.common_solutions.data_loss[
          Math.floor(Math.random() * KNOWLEDGE_BASE.common_solutions.data_loss.length)
        ];
        suggestions = ["Check for backups", "Contact support team", "Try recovery tools"];
        createTicket = true;
        break;
        
      case 'installation_issue':
        response += KNOWLEDGE_BASE.common_solutions.installation[
          Math.floor(Math.random() * KNOWLEDGE_BASE.common_solutions.installation.length)
        ];
        suggestions = ["Run as administrator", "Disable antivirus temporarily", "Check disk space"];
        break;
        
      case 'feature_request':
        response += "Thanks for the feature suggestion! I've noted it down. We're always looking to improve our product based on user feedback.";
        suggestions = ["Submit feature request", "Check roadmap", "Vote on features"];
        createTicket = true;
        break;
        
      default:
        response += KNOWLEDGE_BASE.fallbacks[
          Math.floor(Math.random() * KNOWLEDGE_BASE.fallbacks.length)
        ];
        suggestions = ["Contact support", "Browse documentation", "Submit a ticket"];
    }
    
    // For high priority issues, suggest creating a ticket
    if (priority === 'critical') {
      response += " This seems like a critical issue. I recommend creating a support ticket immediately.";
      createTicket = true;
    }
    
    return {
      text: response,
      category,
      priority,
      suggestions,
      createTicket,
      pendingTicket: createTicket ? {
        subject: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        text: userMessage,
        category,
        priority
      } : null
    };
  };

  // Send message to the chatbot
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // Create message ID for tracking
    const messageId = `msg_${Date.now()}`;
    
    // Add user message to chat
    const userMessage = {
      id: messageId,
      text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    
    try {
      // Analyze the message
      const analysis = analyzeMessage(text);
      
      // Generate a response
      const response = generateResponse(analysis, text);
      
      // Store pending ticket if needed
      if (response.pendingTicket) {
        setPendingTicket(response.pendingTicket);
      }
      
      // Add typing indicator
      setMessages(prev => [...prev, { 
        id: 'typing', 
        text: '...', 
        sender: 'bot', 
        isTyping: true,
        timestamp: new Date().toISOString() 
      }]);
      
      // Simulate bot typing delay
      setTimeout(() => {
        // Add bot response
        const botMessage = {
          id: `resp_${Date.now()}`,
          text: response.text,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          category: response.category,
          priority: response.priority,
          suggestions: response.suggestions
        };
        
        setMessages(prev => prev.filter(msg => !msg.isTyping).concat([botMessage]));
        setLoading(false);
        
        // If response suggests creating a ticket
        if (response.createTicket) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `suggestion_${Date.now()}`,
              text: "Would you like me to create a support ticket for this issue?",
              sender: 'bot',
              isTicketSuggestion: true,
              timestamp: new Date().toISOString()
            }]);
          }, 1000);
        }
      }, 1500);
      
    } catch (err) {
      console.error('Chat processing error:', err);
      setLoading(false);
      
      // Remove typing indicator if present
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add fallback response message
      const fallbackMessage = {
        id: `error_${Date.now()}`,
        text: "I'm having trouble understanding your request. Could you try phrasing it differently?",
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };
  
  // Create ticket from chat
  const createTicketFromChat = async () => {
    if (!pendingTicket) return null;
    
    try {
      // Submit the ticket
      const newTicket = await submitTicket(pendingTicket);
      
      // Add confirmation message
      setMessages(prev => [...prev, {
        id: `ticket_${Date.now()}`,
        text: `I've created ticket #${newTicket.ticket_id} for you. Our support team will look into this issue soon.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isTicketConfirmation: true
      }]);
      
      // Clear pending ticket
      setPendingTicket(null);
      
      return newTicket;
    } catch (err) {
      console.error('Error creating ticket:', err);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        text: "I couldn't create a ticket right now. Please try again later or submit it manually.",
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
      
      return null;
    }
  };

  // Clear chat history
  const clearChat = () => {
    const randomGreeting = KNOWLEDGE_BASE.greetings[
      Math.floor(Math.random() * KNOWLEDGE_BASE.greetings.length)
    ];
    
    setMessages([{
      id: `welcome_${Date.now()}`,
      text: randomGreeting,
      sender: 'bot',
      timestamp: new Date().toISOString()
    }]);
    
    // Reset pending ticket
    setPendingTicket(null);
  };

  // Context value
  const value = {
    messages,
    loading,
    error,
    connected,
    sendMessage,
    clearChat,
    createTicketFromChat,
    pendingTicket
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 