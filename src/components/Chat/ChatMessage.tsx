import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Wrench } from 'lucide-react';
import type { StreamingMessage } from '../../types/chat';

interface ChatMessageProps {
  message: StreamingMessage;
}

const TOOL_NAME_MAP: Record<string, string> = {
  tool_list_goals: 'Listing goals',
  tool_get_goal: 'Getting goal details',
  tool_create_goal: 'Creating goal',
  tool_update_goal: 'Updating goal',
  tool_delete_goal: 'Deleting goal',
  tool_list_tasks: 'Listing tasks',
  tool_get_task: 'Getting task details',
  tool_create_task: 'Creating task',
  tool_update_task: 'Updating task',
  tool_delete_task: 'Deleting task',
  tool_list_goal_tags: 'Listing goal tags',
  tool_create_goal_tag: 'Creating goal tag',
  tool_update_goal_tag: 'Updating goal tag',
  tool_delete_goal_tag: 'Deleting goal tag',
  tool_list_words: 'Listing words',
  tool_get_word: 'Getting word details',
  tool_create_word: 'Creating word',
  tool_update_word: 'Updating word',
  tool_delete_word: 'Deleting word',
  tool_list_word_tags: 'Listing word tags',
  tool_create_word_tag: 'Creating word tag',
  tool_update_word_tag: 'Updating word tag',
  tool_delete_word_tag: 'Deleting word tag',
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isHuman = message.role === 'human';

  return (
    <div className={`flex gap-3 ${isHuman ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isHuman
            ? 'bg-primary-500/20'
            : 'bg-emerald-500/20'
        }`}
      >
        {isHuman ? (
          <User size={16} className="text-primary-400" />
        ) : (
          <Bot size={16} className="text-emerald-400" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`max-w-[80%] ${isHuman ? 'text-right' : ''}`}
      >
        {/* Tool call indicators */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {message.toolCalls.map((tc, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300"
              >
                <Wrench size={12} />
                <span>{TOOL_NAME_MAP[tc.name] || tc.name}</span>
                {tc.result && (
                  <span className="text-emerald-400 ml-1">done</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl ${
            isHuman
              ? 'bg-primary-500 text-white rounded-tr-md'
              : 'bg-dark-800 text-dark-100 rounded-tl-md'
          }`}
        >
          {isHuman ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_code]:text-emerald-300 [&_code]:bg-dark-900/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (message.isStreaming ? '...' : '')}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
