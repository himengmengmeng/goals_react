import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Minimize2, Maximize2, PanelLeftClose, PanelLeft } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { chatService } from '../../services/chat';
import type { Conversation, StreamingMessage, ToolCallInfo } from '../../types/chat';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const data = await chatService.listConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const data = await chatService.getConversation(conversationId);
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.tool_calls || undefined,
        }))
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (id: number) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    loadMessages(id);
  };

  const handleNewConversation = async () => {
    try {
      const conv = await chatService.createConversation();
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    let conversationId = activeConversationId;

    // Auto-create conversation if none selected
    if (!conversationId) {
      try {
        const conv = await chatService.createConversation();
        setConversations((prev) => [conv, ...prev]);
        setActiveConversationId(conv.id);
        conversationId = conv.id;
      } catch {
        return;
      }
    }

    // Add human message
    const humanMsg: StreamingMessage = {
      role: 'human',
      content,
    };
    setMessages((prev) => [...prev, humanMsg]);

    // Add placeholder AI message
    const aiMsg: StreamingMessage = {
      role: 'ai',
      content: '',
      isStreaming: true,
      toolCalls: [],
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsStreaming(true);

    const currentToolCalls: ToolCallInfo[] = [];

    try {
      console.log('[Chat] Sending message to conversation:', conversationId);
      await chatService.sendMessage(conversationId, content, {
        onToken: (data) => {
          console.log('[Chat] onToken:', data.content);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + data.content,
              };
            }
            return updated;
          });
        },
        onToolCall: (data) => {
          currentToolCalls.push({
            name: data.name,
            args: data.args,
            result: null,
          });
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                toolCalls: [...currentToolCalls],
              };
            }
            return updated;
          });
        },
        onToolResult: (data) => {
          const tc = currentToolCalls.find((t) => t.name === data.name && !t.result);
          if (tc) tc.result = data.result;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                toolCalls: [...currentToolCalls],
              };
            }
            return updated;
          });
        },
        onDone: (data) => {
          console.log('[Chat] onDone:', data);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                id: data.message_id ?? undefined,
                isStreaming: false,
              };
            }
            return updated;
          });

          // Update conversation name if returned
          if (data.conversation_name) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId
                  ? { ...c, name: data.conversation_name, updated_at: new Date().toISOString() }
                  : c
              )
            );
          }
        },
        onError: (data) => {
          console.error('[Chat] onError:', data);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: `Error: ${data.detail}`,
                isStreaming: false,
              };
            }
            return updated;
          });
        },
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: 'Failed to connect to the AI service. Please try again.',
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Window */}
      <div
        className={`relative flex bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-slide-up ${
          isMaximized
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-4xl h-[75vh]'
        }`}
      >
        {/* Sidebar */}
        {showSidebar && (
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDelete={handleDeleteConversation}
            isLoading={isLoadingConversations}
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-800 bg-dark-900">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              </button>
              <h2 className="text-sm font-medium text-white truncate">
                {activeConversationId
                  ? conversations.find((c) => c.id === activeConversationId)?.name || 'New Chat'
                  : 'XMeng'}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="spinner w-6 h-6" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                      <path d="M10 22h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">XMeng</h3>
                  <p className="text-sm text-dark-400">
                    Ask me anything! I can help you manage goals, tasks, and vocabulary, or just chat.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={msg.id || `msg-${index}`} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder={
              activeConversationId
                ? 'Type your message...'
                : 'Start a new conversation...'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
