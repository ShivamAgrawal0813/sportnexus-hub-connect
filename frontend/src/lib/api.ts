// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  token?: string;
}

interface ApiError {
  message: string;
  error?: string;
}

// Auth API calls
export const authAPI = {
  // Register a new user
  register: async (userData: RegisterData): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },
  
  // Login user
  login: async (userData: LoginData): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      localStorage.removeItem('token');
      return null;
    }
    
    const data = await response.json();
    return { ...data, token };
  },
  
  // Forgot password - request reset email
  forgotPassword: async (email: string): Promise<{ success: boolean, message: string }> => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  },
  
  // Reset password with token
  resetPassword: async (token: string, password: string): Promise<{ success: boolean, message: string, token?: string }> => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
  },
};

// Helper function for authenticated requests
export const createAuthenticatedRequest = async (
  url: string,
  method: string = 'GET',
  body: any = null
) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_URL}${url}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
};

export type { User, RegisterData, LoginData, ApiError }; 