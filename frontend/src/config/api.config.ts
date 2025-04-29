// Base URL for API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
}; 