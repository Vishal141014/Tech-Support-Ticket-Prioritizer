import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';

const ChatBot = () => {
  const { messages, sendMessage, loading, connected, createTicketFromChat, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input);
      setInput('');
    }
  };

  // Handle click on a suggestion
  const handleSuggestionClick = (suggestion) => {
    if (!loading) {
      sendMessage(suggestion);
    }
  };

  // Handle ticket creation suggestion response
  const handleTicketSuggestionResponse = async (response) => {
    if (response === 'yes') {
      // Show a message to indicate ticket creation is in progress
      sendMessage("Yes, please create a ticket for this issue.");
      
      // Add slight delay to allow the message to show before ticket creation
      setTimeout(async () => {
        try {
          // Use the createTicketFromChat function to create a ticket
          await createTicketFromChat();
        } catch (err) {
          console.error("Error creating ticket:", err);
        }
      }, 500);
    } else {
      sendMessage("No thanks, I don't need a ticket right now.");
    }
  };

  // Toggle chatbot visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Reset chat
  const handleClearChat = () => {
    clearChat();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat toggle button */}
      <button 
        onClick={toggleChat}
        className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <img src="/images/syntax_samurai_logo.svg" alt="Syntax Samurai" className="h-8 w-8 mr-2" />
              <div>
                <h3 className="font-medium">Syntax Samurai Support</h3>
                <div className="text-xs flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span>{connected ? 'AI Assistant' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleClearChat} 
                className="text-white mr-3 opacity-70 hover:opacity-100"
                title="Clear conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={toggleChat} className="text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <img src="/images/syntax_samurai_logo.svg" alt="Syntax Samurai" className="h-16 w-16 mb-2" />
                <p>How can I help you today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`max-w-xs lg:max-w-md xl:max-w-lg mb-3 ${
                    msg.sender === 'user' 
                      ? 'ml-auto text-right' 
                      : 'mr-auto'
                  }`}
                >
                  {msg.sender === 'bot' && index > 0 && (
                    <div className="flex items-center mb-1">
                      <img src="/images/syntax_samurai_logo.svg" alt="Bot" className="h-5 w-5 mr-1" />
                      <span className="text-xs font-medium text-blue-600">Support Assistant</span>
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg px-4 py-2 inline-block ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : msg.isTyping
                          ? 'bg-gray-100 text-gray-500'
                        : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                        : msg.isTicketConfirmation
                          ? 'bg-green-50 text-green-800 border border-green-200'
                        : msg.isFallback
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.isTyping ? (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    ) : (
                      msg.text
                    )}

                    {/* If message has category/priority, display it */}
                    {msg.sender === 'bot' && msg.category && msg.priority && !msg.isError && !msg.isTyping && (
                      <div className="mt-1 text-xs flex">
                        <span className={`inline-block px-2 py-1 rounded ${
                          msg.category === 'bug' ? 'bg-red-100 text-red-800' :
                          msg.category === 'feature' ? 'bg-purple-100 text-purple-800' :
                          msg.category === 'query' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.category}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded ml-1 ${
                          msg.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          msg.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          msg.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {msg.priority}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  
                  {/* Suggestions */}
                  {msg.sender === 'bot' && msg.suggestions && !msg.isTyping && (
                    <div className="mt-2 space-y-1">
                      {msg.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs text-left px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors block max-w-xs truncate"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Ticket suggestion buttons */}
                  {msg.isTicketSuggestion && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleTicketSuggestionResponse('yes')}
                        className="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      >
                        Yes, create ticket
                      </button>
                      <button
                        onClick={() => handleTicketSuggestionResponse('no')}
                        className="text-xs px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors"
                      >
                        No thanks
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="bg-white p-3 border-t">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || !connected}
                placeholder={connected ? "Type your message..." : "Reconnecting..."}
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !connected}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
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

export default ChatBot; 