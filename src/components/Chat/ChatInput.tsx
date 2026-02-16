import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const supportsVoice =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (!supportsVoice) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-dark-700 bg-dark-900">
      {/* Voice button */}
      {supportsVoice && (
        <button
          onClick={toggleVoice}
          disabled={disabled}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isListening
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? 'Stop recording' : 'Voice input'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      )}

      {/* Text input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-dark-500 resize-none focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="flex-shrink-0 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
      >
        {disabled ? <Square size={18} /> : <Send size={18} />}
      </button>
    </div>
  );
};

export default ChatInput;
