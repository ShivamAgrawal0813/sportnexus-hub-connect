import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    favorites?: {
      venues?: string[];
      equipment?: string[];
      tutorials?: string[];
    };
    preferences?: {
      sportTypes?: string[];
      notifications?: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });
      
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Registration successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return false;
      }
      
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setUser(response.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 