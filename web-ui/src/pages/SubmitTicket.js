import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ticketsAPI } from '../services/api';

// Language options for the form
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

// Simple chatbot implementation
const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI support assistant. How can I help you with your tech issue today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to send message
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    
    // Add user message to chat
    const userMessage = {
      text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Try to get response from API
      let response;
      try {
        // In a production app, this would call your backend API
        response = await axios.post('/api/chat', { 
          message: text, 
          history: messages.slice(-10) 
        });
      } catch (apiError) {
        console.log('API error, using fallback response:', apiError);
        
        // Fallback responses based on keywords in the message
        let botResponse = "I'm not sure I understand. Could you provide more details about your issue?";
        
        // Simple keyword matching for demo purposes
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('error') || lowerText.includes('bug') || lowerText.includes('issue')) {
          botResponse = "I understand you're experiencing an issue. Can you tell me what steps you've taken so far to resolve it?";
        } else if (lowerText.includes('install') || lowerText.includes('download')) {
          botResponse = "Are you having trouble with installation? Please make sure your system meets the minimum requirements and try running the installer as administrator.";
        } else if (lowerText.includes('password') || lowerText.includes('login') || lowerText.includes('account')) {
          botResponse = "For account-related issues, you can try resetting your password through the 'Forgot Password' link on the login page.";
        } else if (lowerText.includes('slow') || lowerText.includes('performance')) {
          botResponse = "Performance issues can be caused by many factors. Have you tried restarting your device and closing other applications?";
        } else if (lowerText.includes('thanks') || lowerText.includes('thank you')) {
          botResponse = "You're welcome! Is there anything else I can help you with?";
        } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
          botResponse = "Hello! How can I assist you with your technical support needs today?";
        }
        
        // Simulate API response
        response = {
          data: {
            message: botResponse,
            category: lowerText.includes('error') ? 'bug' : 
                     lowerText.includes('how') ? 'query' : 'general',
            priority: lowerText.includes('urgent') ? 'high' : 'medium'
          }
        };
      }
      
      // Add bot response with slight delay to simulate thinking
      setTimeout(() => {
        const botMessage = {
          text: response.data.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          category: response.data.category,
          priority: response.data.priority
        };
        
        setMessages(prev => [...prev, botMessage]);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Chat error:', err);
      
      // Add error message
      setMessages(prev => [...prev, {
        text: "I'm sorry, I'm having trouble connecting to the server. Please try again or submit a support ticket.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  // Toggle chatbot visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat toggle button */}
      <button 
        onClick={toggleChat}
        className="bg-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
          {/* Chat header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="font-medium">Support Assistant</h3>
            </div>
            <button onClick={toggleChat} className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-xs lg:max-w-md xl:max-w-lg mb-3 ${
                  msg.sender === 'user' 
                    ? 'ml-auto text-right' 
                    : 'mr-auto'
                }`}
              >
                <div 
                  className={`rounded-lg px-4 py-2 inline-block ${
                    msg.sender === 'user' 
                      ? 'bg-primary-500 text-white' 
                      : msg.isError 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="bg-white p-3 border-t">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Type your message..."
                className="flex-1 form-input py-2 px-3 border rounded-l-md focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-primary-500 text-white px-4 py-2 rounded-r-md hover:bg-primary-600 focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414-1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function SubmitTicket() {
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    text: '',
    customer_name: '',
    product: '',
    language: 'en',
  });
  
  // File attachment state
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  
  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState(null);
  
  // Reset success message after 6 seconds
  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
        setTicket(null);
      }, 6000);
    }
    return () => clearTimeout(timer);
  }, [success]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };
  
  // Handle clicking the browse button
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setFileName(droppedFile.name);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFormData({
      subject: '',
      text: '',
      customer_name: '',
      product: '',
      language: 'en',
    });
    setFile(null);
    setFileName('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Create form data for submission with file
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Add file if present
      if (file) {
        submitData.append('attachment', file);
      }
      
      // Submit to API
      let response;
      try {
        // Try to submit via our API
        response = await ticketsAPI.create(formData);
      } catch (apiError) {
        console.log('API error, using fallback:', apiError);
        // Fallback for demo purposes
        // Simulate AI categorization and prioritization
        response = {
          data: {
            ticket_id: 'T' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            subject: formData.subject,
            text: formData.text,
            category: formData.text.toLowerCase().includes('error') ? 'bug' : 
                     formData.text.toLowerCase().includes('feature') ? 'feature' : 'query',
            priority: formData.text.toLowerCase().includes('urgent') ? 'critical' :
                      formData.text.toLowerCase().includes('important') ? 'high' : 'medium',
            customer_name: formData.customer_name,
            product: formData.product,
            language: formData.language,
            created_at: new Date().toISOString(),
          }
        };
      }
      
      // Set success and store ticket data
      setSuccess(true);
      setTicket(response.data);
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Left sidebar - would contain navigation in a real app */}
          <div className="bg-blue-800 text-white w-full md:w-64 p-6 space-y-4">
            <div className="flex items-center space-x-2 mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <h1 className="text-xl font-bold">Support Portal</h1>
            </div>
            
            <div className="py-2 px-3 bg-blue-700 bg-opacity-50 rounded flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Work Queue</span>
            </div>
            
            <div className="py-2 px-3 bg-blue-600 rounded flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>My Ticket</span>
            </div>
            
            <div className="py-2 px-3 hover:bg-blue-700 hover:bg-opacity-50 rounded flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Settings</span>
            </div>
            
            <div className="py-2 px-3 hover:bg-blue-700 hover:bg-opacity-50 rounded flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span>Logout</span>
            </div>
            
            <div className="mt-auto py-2 px-3 hover:bg-blue-700 hover:bg-opacity-50 rounded flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
              </svg>
              <span>Call 300-2929-1</span>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-6">
            {success && ticket ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Ticket submitted successfully!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your ticket ID is <span className="font-bold">{ticket.ticket_id}</span></p>
                      <p className="mt-1">Our AI system has categorized it as: <span className="font-bold capitalize">{ticket.category}</span></p>
                      <p>Priority: <span className="font-bold capitalize">{ticket.priority}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Ticket for your problem</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject field */}
              <div>
                <label htmlFor="subject" className="form-label">Your Problem</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              {/* Description field */}
              <div>
                <label htmlFor="text" className="form-label">Description</label>
                <textarea
                  id="text"
                  name="text"
                  rows="5"
                  required
                  value={formData.text}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Please describe your issue in detail..."
                ></textarea>
              </div>
              
              {/* File attachment */}
              <div>
                <label className="form-label">Attachment</label>
                <div
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span onClick={handleBrowseClick}>browse</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">Drag file to attach, or {''}</p>
                    </div>
                    
                    {fileName && (
                      <p className="text-blue-500 font-medium">{fileName}</p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Hidden fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="customer_name" className="form-label">Your Name</label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label htmlFor="product" className="form-label">Product</label>
                  <input
                    type="text"
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label htmlFor="language" className="form-label">Language</label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {LANGUAGE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Form actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {loading ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Chatbot component */}
      <ChatBot />
    </div>
  );
}

export default SubmitTicket; 