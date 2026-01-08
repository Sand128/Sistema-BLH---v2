
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
        id: '1001',
        name: 'Dra. Elena Torres',
        username: 'etorres',
        email,
        role: 'ADMIN',
        sector: 'ISEM',
        coordination: 'HMPMPS',
        area: 'Coordinación General',
        status: 'ACTIVE',
        registrationDate: '2023-01-01',
        avatarUrl: 'https://i.pravatar.cc/150?u=1001'
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }

    if (email === 'staff@blh.com' && password === 'staff') {
      const user: User = {
        id: '1002',
        name: 'Enf. Carla Ruiz',
        username: 'cruiz',
        email,
        role: 'RESPONSABLE_BLH',
        sector: 'ISEM',
        coordination: 'HMPMPS',
        area: 'Captación',
        status: 'ACTIVE',
        registrationDate: '2023-06-15',
        avatarUrl: 'https://i.pravatar.cc/150?u=1002'
      };
      
      const storedUsers = localStorage.getItem('blh_system_users');
      if (storedUsers) {
          const users: User[] = JSON.parse(storedUsers);
          const dbUser = users.find(u => u.email === email);
          if (dbUser && dbUser.status === 'SUSPENDED') {
              throw new Error('Su cuenta ha sido SUSPENDIDA. Contacte al administrador.');
          }
          if (dbUser && dbUser.status === 'INACTIVE') {
              throw new Error('Su cuenta está INACTIVA.');
          }
      }

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

  updateCurrentUser: (user: User) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};
