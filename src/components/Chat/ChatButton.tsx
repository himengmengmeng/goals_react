import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';

const ChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsChatOpen(true)}
        className="relative p-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-all duration-200 group"
        title="XMeng"
      >
        <MessageCircle size={20} />
        {/* Pulse indicator */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full">
          <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
        </span>
      </button>

      {createPortal(
        <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />,
        document.body
      )}
    </>
  );
};

export default ChatButton;
