
import { User, UserRole } from '../types';

const STORAGE_KEY = 'blh_system_users';

const INITIAL_USERS: User[] = [
  {
    id: '1001',
    name: 'Dra. Elena Torres',
    username: 'etorres',
    email: 'admin@blh.com',
    role: 'ADMIN',
    sector: 'ISEM',
    coordination: 'HMPMPS',
    area: 'Coordinación General',
    status: 'ACTIVE',
    registrationDate: '2023-01-01',
    lastAccess: '2024-05-20T10:30:00',
    avatarUrl: 'https://i.pravatar.cc/150?u=1001'
  },
  {
    id: '1002',
    name: 'Lic. Roberto Gómez',
    username: 'rgomez',
    email: 'rgomez@salud.gob.mx',
    role: 'SUPERVISOR',
    sector: 'ISEM',
    coordination: 'HMICJOD',
    area: 'Supervisión de Calidad',
    status: 'ACTIVE',
    registrationDate: '2023-06-15',
    lastAccess: '2024-05-19T14:22:10',
    avatarUrl: 'https://i.pravatar.cc/150?u=1002'
  }
];

export const userService = {
  getAll: async (): Promise<User[]> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(stored);
  },

  getById: async (id: string): Promise<User | undefined> => {
    const users = await userService.getAll();
    return users.find(u => u.id === id);
  },

  create: async (userData: Omit<User, 'id' | 'registrationDate' | 'status'>, password?: string): Promise<User> => {
    const users = await userService.getAll();
    
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('El nombre de usuario ya existe.');
    }

    const maxId = users.length > 0 ? Math.max(...users.map(u => parseInt(u.id))) : 1000;
    const newUser: User = {
      ...userData,
      id: (maxId + 1).toString(),
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...users, newUser]));
    return newUser;
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const users = await userService.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');

    if (updates.username && users.some(u => u.id !== id && u.username.toLowerCase() === updates.username?.toLowerCase())) {
        throw new Error('El nombre de usuario ya está en uso.');
    }

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return updatedUser;
  },

  delete: async (id: string): Promise<void> => {
      const users = await userService.getAll();
      const filtered = users.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  changePassword: async (id: string, newPassword: string): Promise<void> => {
      // Simulación de hash y registro de auditoría
      console.log(`Auditoría: Contraseña actualizada para usuario ID ${id} en ${new Date().toLocaleString()}`);
      await new Promise(resolve => setTimeout(resolve, 500));
  },

  suspend: async (id: string): Promise<User> => {
      return userService.update(id, { status: 'SUSPENDED' });
  },

  activate: async (id: string): Promise<User> => {
      return userService.update(id, { status: 'ACTIVE' });
  },

  toggleStatus: async (id: string): Promise<User> => {
    const user = await userService.getById(id);
    if (!user) throw new Error('Usuario no encontrado');
    
    // Si está suspendido o inactivo, lo activamos. Si está activo, lo inactivamos por defecto
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return userService.update(id, { status: newStatus });
  }
};
