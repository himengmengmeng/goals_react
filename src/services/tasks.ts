import api from './api';
import type { Task, TaskCreate, TaskUpdate, TaskListResponse, PaginationParams } from '../types';

export const tasksService = {
  // Get all tasks with pagination and filters
  getAll: async (params?: PaginationParams & { 
    status?: string; 
    priority?: string;
    goal_id?: number;
  }): Promise<TaskListResponse> => {
    const response = await api.get<TaskListResponse>('/api/tasks/', { params });
    return response.data;
  },

  // Get single task by ID
  getById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/api/tasks/${id}`);
    return response.data;
  },

  // Create new task
  create: async (data: TaskCreate): Promise<Task> => {
    const response = await api.post<Task>('/api/tasks/', data);
    return response.data;
  },

  // Update task
  update: async (id: number, data: TaskUpdate): Promise<Task> => {
    const response = await api.put<Task>(`/api/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },
};
