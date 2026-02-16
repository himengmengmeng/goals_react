import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Check, X } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const preRecordingInputRef = useRef('');

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

  const startRecording = () => {
    if (!supportsVoice || isRecording) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    preRecordingInputRef.current = input;
    setFinalTranscript('');
    setInterimTranscript('');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalTranscript(final);
      setInterimTranscript(interim);

      const combined = preRecordingInputRef.current
        ? preRecordingInputRef.current + ' ' + final + interim
        : final + interim;
      setInput(combined);
    };

    recognition.onend = () => {
      // If the browser auto-stops (e.g. long silence), restart to keep continuous
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // ignore if already started
        }
      }
    };

    recognition.onerror = (event) => {
      // Ignore no-speech errors during continuous recording, just restart
      if (event.error === 'no-speech') return;
      console.error('[Voice] Recognition error:', event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      ref.onend = null;
      ref.stop();
    }
    setIsRecording(false);
    setInterimTranscript('');
    setFinalTranscript('');
  };

  const confirmRecording = () => {
    // Keep current input text (already contains the transcription)
    stopRecording();
    textareaRef.current?.focus();
  };

  const cancelRecording = () => {
    // Restore input to what it was before recording
    setInput(preRecordingInputRef.current);
    stopRecording();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        const ref = recognitionRef.current;
        recognitionRef.current = null;
        ref.onend = null;
        ref.stop();
      }
    };
  }, []);

  return (
    <div className="border-t border-dark-700 bg-dark-900">
      {/* Recording indicator bar */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs text-red-400 font-medium">Recording...</span>
          {interimTranscript && (
            <span className="text-xs text-dark-500 italic truncate ml-1">
              {interimTranscript}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        {isRecording ? (
          <>
            {/* Cancel button */}
            <button
              onClick={cancelRecording}
              className="flex-shrink-0 w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              title="Discard recording"
            >
              <X size={18} />
            </button>

            {/* Text input (shows live transcript) */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                readOnly
                rows={1}
                className="w-full px-3 py-2 bg-dark-800 border border-red-500/30 rounded-xl text-sm text-white placeholder-dark-500 resize-none focus:outline-none leading-[18px]"
                style={{ maxHeight: '120px' }}
                placeholder="Listening..."
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={confirmRecording}
              className="flex-shrink-0 w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              title="Accept recording"
            >
              <Check size={18} />
            </button>
          </>
        ) : (
          <>
            {/* Voice button */}
            {supportsVoice && (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="flex-shrink-0 w-[34px] h-[34px] flex items-center justify-center rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Voice input"
              >
                <Mic size={18} />
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
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-dark-500 resize-none focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed leading-[18px]"
                style={{ maxHeight: '120px' }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="flex-shrink-0 w-[34px] h-[34px] flex items-center justify-center bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
            >
              {disabled ? <Square size={18} /> : <Send size={18} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
