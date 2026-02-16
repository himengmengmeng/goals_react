import React from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import type { Conversation } from '../../types/chat';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelect: (id: number) => void;
  onNewConversation: () => void;
  onDelete: (id: number) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNewConversation,
  onDelete,
  onClose,
  isLoading = false,
}) => {
  return (
    <div className="w-64 flex-shrink-0 bg-dark-950 border-r border-dark-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-dark-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark-300">Conversations</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewConversation}
            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner w-5 h-5" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="mx-auto text-dark-600 mb-2" />
            <p className="text-xs text-dark-500">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={clsx(
                'group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                activeConversationId === conv.id
                  ? 'bg-dark-800 text-white'
                  : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
              )}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="flex-1 text-xs truncate">
                {conv.name || 'New Chat'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="hidden group-hover:block p-1 text-dark-500 hover:text-red-400 rounded transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
