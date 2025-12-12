import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axiosConfig";
import "./css/Messages.css";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState(
    location.state?.selectedConversation || null
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/conversations/");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setMessageLoading(true);
      const res = await api.post(`/conversations/${selectedConversation.id}/messages/`, {
        content: newMessage
      });
      
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message: res.data }
            : conv
        )
      );
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) return <div className="card p-4">Loading messages...</div>;

  return (
    <div className="messages-container">
      <div className="row g-0">
        <div className="col-md-4 conversations-sidebar">
          <div className="conversations-header p-3">
            <h5 className="mb-0">Messages</h5>
          </div>
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="p-3 text-center text-muted">
                No conversations yet
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item p-3 ${
                    selectedConversation?.id === conv.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{conv.participant}</strong>
                    <small className="text-muted">
                      {conv.last_message && new Date(conv.last_message.created_at).toLocaleTimeString()}
                    </small>
                  </div>
                  {conv.last_message && (
                    <p className="mb-0 text-truncate text-muted">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-md-8 messages-area">
          {selectedConversation ? (
            <>
              <div className="messages-header p-3">
                <h6 className="mb-0">Chat with {selectedConversation.participant}</h6>
              </div>
              
              <div className="messages-list p-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${
                        msg.is_sender ? 'sent' : 'received'
                      }`}
                    >
                      <div className="message-content">
                        <p className="mb-1">{msg.content}</p>
                        <small className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="message-input p-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={messageLoading || !newMessage.trim()}
                  >
                    {messageLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center text-muted">
                <i className="bi bi-chat fs-1 mb-3"></i>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}