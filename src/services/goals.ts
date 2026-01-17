import api from './api';
import type { Goal, GoalCreate, GoalUpdate, GoalListResponse, PaginationParams } from '../types';

export const goalsService = {
  // Get all goals with pagination and filters
  getAll: async (params?: PaginationParams & { status?: string; priority?: string; tag_id?: number }): Promise<GoalListResponse> => {
    const response = await api.get<GoalListResponse>('/api/goals/', { params });
    return response.data;
  },

  // Get single goal by ID
  getById: async (id: number): Promise<Goal> => {
    const response = await api.get<Goal>(`/api/goals/${id}`);
    return response.data;
  },

  // Create new goal
  create: async (data: GoalCreate): Promise<Goal> => {
    const response = await api.post<Goal>('/api/goals/', data);
    return response.data;
  },

  // Update goal
  update: async (id: number, data: GoalUpdate): Promise<Goal> => {
    const response = await api.put<Goal>(`/api/goals/${id}`, data);
    return response.data;
  },

  // Delete goal
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/goals/${id}`);
  },
};
