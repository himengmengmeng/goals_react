import api from './api';
import type { Word, WordCreate, WordUpdate, WordListResponse, PaginationParams } from '../types';

export const wordsService = {
  // Get all words with pagination and filters
  getAll: async (params?: PaginationParams & { 
    search?: string; 
    tag_id?: number;
  }): Promise<WordListResponse> => {
    const response = await api.get<WordListResponse>('/api/words/', { params });
    return response.data;
  },

  // Get single word by ID
  getById: async (id: number): Promise<Word> => {
    const response = await api.get<Word>(`/api/words/${id}`);
    return response.data;
  },

  // Create new word
  create: async (data: WordCreate): Promise<Word> => {
    const response = await api.post<Word>('/api/words/', data);
    return response.data;
  },

  // Update word
  update: async (id: number, data: WordUpdate): Promise<Word> => {
    const response = await api.put<Word>(`/api/words/${id}`, data);
    return response.data;
  },

  // Delete word
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/words/${id}`);
  },

  // Upload media file
  uploadMedia: async (wordId: number, file: File): Promise<{ id: number; file_url: string; uploaded_at: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/words/${wordId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete media file
  deleteMedia: async (wordId: number, mediaId: number): Promise<void> => {
    await api.delete(`/api/words/${wordId}/media/${mediaId}`);
  },
};
