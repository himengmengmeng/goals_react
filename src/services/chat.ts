import api, { tokenManager } from './api';
import type {
  Conversation,
  ConversationDetail,
  ConversationListResponse,
  SSETokenEvent,
  SSEToolCallEvent,
  SSEToolResultEvent,
  SSEDoneEvent,
  SSEErrorEvent,
} from '../types/chat';

const API_BASE_URL = 'http://localhost:8001';

/**
 * Parse a single SSE event block (event + data lines) and dispatch to callbacks.
 */
function dispatchSSEEvent(
  eventType: string,
  eventData: string,
  callbacks: {
    onToken?: (data: SSETokenEvent) => void;
    onToolCall?: (data: SSEToolCallEvent) => void;
    onToolResult?: (data: SSEToolResultEvent) => void;
    onDone?: (data: SSEDoneEvent) => void;
    onError?: (data: SSEErrorEvent) => void;
  }
) {
  if (!eventType || !eventData) return;

  try {
    const parsed = JSON.parse(eventData);
    switch (eventType) {
      case 'token':
        callbacks.onToken?.(parsed as SSETokenEvent);
        break;
      case 'tool_call':
        callbacks.onToolCall?.(parsed as SSEToolCallEvent);
        break;
      case 'tool_result':
        callbacks.onToolResult?.(parsed as SSEToolResultEvent);
        break;
      case 'done':
        callbacks.onDone?.(parsed as SSEDoneEvent);
        break;
      case 'error':
        callbacks.onError?.(parsed as SSEErrorEvent);
        break;
    }
  } catch (e) {
    console.warn('[SSE] Failed to parse event data:', eventData, e);
  }
}

export const chatService = {
  async createConversation(name: string = ''): Promise<Conversation> {
    const response = await api.post('/api/chat/conversations', { name });
    return response.data;
  },

  async listConversations(skip = 0, limit = 50): Promise<ConversationListResponse> {
    const response = await api.get('/api/chat/conversations', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getConversation(id: number): Promise<ConversationDetail> {
    const response = await api.get(`/api/chat/conversations/${id}`);
    return response.data;
  },

  async updateConversation(id: number, name: string): Promise<Conversation> {
    const response = await api.patch(`/api/chat/conversations/${id}`, { name });
    return response.data;
  },

  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/api/chat/conversations/${id}`);
  },

  async sendMessage(
    conversationId: number,
    content: string,
    callbacks: {
      onToken?: (data: SSETokenEvent) => void;
      onToolCall?: (data: SSEToolCallEvent) => void;
      onToolResult?: (data: SSEToolResultEvent) => void;
      onDone?: (data: SSEDoneEvent) => void;
      onError?: (data: SSEErrorEvent) => void;
    }
  ): Promise<void> {
    const token = tokenManager.getAccessToken();
    const url = `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`;

    console.log('[SSE] Sending message to:', url);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error('[SSE] Fetch failed:', err);
      callbacks.onError?.({ detail: 'Network error: failed to connect' });
      return;
    }

    console.log('[SSE] Response status:', response.status, 'content-type:', response.headers.get('content-type'));

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error('[SSE] HTTP error:', error);
      callbacks.onError?.({ detail: error.detail || `HTTP ${response.status}` });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[SSE] No response body reader');
      callbacks.onError?.({ detail: 'No response body' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';
    let eventData = '';
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[SSE] Stream complete after', chunkCount, 'chunks');
          // Process any remaining buffered event
          if (eventType && eventData) {
            dispatchSSEEvent(eventType, eventData, callbacks);
          }
          break;
        }

        chunkCount++;
        const text = decoder.decode(value, { stream: true });
        buffer += text;

        if (chunkCount <= 3) {
          console.log(`[SSE] Chunk #${chunkCount} (${text.length} bytes):`, JSON.stringify(text.slice(0, 200)));
        }

        // Process line by line
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, ''); // Handle \r\n

          if (line === '') {
            // Empty line = end of an SSE event
            if (eventType && eventData) {
              dispatchSSEEvent(eventType, eventData, callbacks);
            }
            eventType = '';
            eventData = '';
          } else if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim();
          }
        }
      }
    } catch (err) {
      console.error('[SSE] Stream reading error:', err);
      callbacks.onError?.({ detail: `Stream error: ${err}` });
    } finally {
      reader.releaseLock();
    }
  },
};
