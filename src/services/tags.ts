import api from './api';
import type { Tag, TagCreate, TagUpdate, TagListResponse, PaginationParams } from '../types';

export const tagsService = {
  // Get all tags with pagination and filters
  getAll: async (params?: PaginationParams & { 
    search?: string; 
    tag_type?: 'goals' | 'words';
  }): Promise<TagListResponse> => {
    const response = await api.get<TagListResponse>('/api/tags/', { params });
    return response.data;
  },

  // Get single tag by ID (requires tag_type)
  getById: async (id: number, tagType: 'goals' | 'words'): Promise<Tag> => {
    const response = await api.get<Tag>(`/api/tags/${id}`, { 
      params: { tag_type: tagType } 
    });
    return response.data;
  },

  // Create new tag
  create: async (data: TagCreate): Promise<Tag> => {
    const response = await api.post<Tag>('/api/tags/', data);
    return response.data;
  },

  // Update tag (requires tag_type)
  update: async (id: number, data: TagUpdate, tagType: 'goals' | 'words'): Promise<Tag> => {
    const response = await api.put<Tag>(`/api/tags/${id}`, data, {
      params: { tag_type: tagType }
    });
    return response.data;
  },

  // Delete tag (requires tag_type)
  delete: async (id: number, tagType: 'goals' | 'words'): Promise<void> => {
    await api.delete(`/api/tags/${id}`, {
      params: { tag_type: tagType }
    });
  },
};
