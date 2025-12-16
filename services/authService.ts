import { User, AuthState } from '../types';

// Simple mock auth service using localStorage
const AUTH_KEY = 'blh_auth_user';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Hardcoded mock credentials for demo
    if (email === 'admin@blh.com' && password === 'admin') {
      const user: User = {
        id: 'u1',
        name: 'Dra. Elena Torres',
        email,
        role: 'ADMIN',
        avatarUrl: 'https://picsum.photos/100/100'
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }

    if (email === 'staff@blh.com' && password === 'staff') {
      const user: User = {
        id: 'u2',
        name: 'Enf. Carla Ruiz',
        email,
        role: 'HEALTH_STAFF',
        avatarUrl: 'https://picsum.photos/100/100'
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error('Credenciales inválidas');
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};