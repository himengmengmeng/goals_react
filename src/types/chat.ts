// ==================== Chat Types ====================

export interface Conversation {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: number;
  role: 'human' | 'ai';
  content: string;
  tool_calls?: ToolCallInfo[] | null;
  created_at: string;
}

export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
  result?: string | null;
}

export interface ConversationDetail {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

// SSE Event types
export interface SSETokenEvent {
  content: string;
}

export interface SSEToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  name: string;
  result: string;
}

export interface SSEDoneEvent {
  message_id: number | null;
  conversation_name: string;
}

export interface SSEErrorEvent {
  detail: string;
}

// Streaming message for display
export interface StreamingMessage {
  id?: number;
  role: 'human' | 'ai';
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCallInfo[];
}
