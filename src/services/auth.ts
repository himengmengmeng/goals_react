import api, { tokenManager } from './api';
import type { Token, User, RegisterRequest, RegisterResponse } from '../types';

export const authService = {
  // Login with username and password
  login: async (username: string, password: string): Promise<Token> => {
    // FastAPI expects form data for OAuth2
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post<Token>('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = response.data;
    tokenManager.setTokens(tokens);
    return tokens;
  },

  // Register new user
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      await api.post('/api/auth/logout', { refresh_token: refreshToken });
    } catch {
      // Ignore errors during logout
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout-all');
    } catch {
      // Ignore errors
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return tokenManager.getAccessToken() !== null;
  },

  // Refresh token manually
  refreshToken: async (): Promise<Token> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<Token>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    const tokens = response.data;
    tokenManager.setTokens(tokens);
    return tokens;
  },
};
