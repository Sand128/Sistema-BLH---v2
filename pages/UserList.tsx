
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Search, Edit, Lock, Power, 
  ShieldCheck, User as UserIcon, Hospital, Calendar, 
  Trash2, Eye, ChevronUp, ChevronDown, 
  Info, AlertTriangle, Ban, CheckCircle2
} from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { User as SystemUser, UserRole } from '../types';
import { Button } from '../components/ui/Button';

type SortKey = 'id' | 'name' | 'role' | 'coordination' | 'registrationDate';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [sortKey, setSortKey] = useState<SortKey>('registrationDate');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        if (sortKey === 'id') {
            return sortOrder === 'asc' ? parseInt(valA) - parseInt(valB) : parseInt(valB) - parseInt(valA);
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    setFilteredUsers(result);
  }, [searchTerm, users, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
      if (sortKey === key) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortOrder('asc');
      }
  };

  const handleResetPassword = async (user: SystemUser) => {
      const isSelf = user.id === currentUser?.id;
      
      if (isSelf) {
          alert("Se detectó que el usuario tiene sesión activa. Esta sesión se cerrará para continuar con el cambio de contraseña.");
      }

      const newPass = prompt(`Introduzca nueva contraseña para ${user.username}:`);
      if (!newPass) return;
      if (newPass.length < 8) return alert("La contraseña debe tener al menos 8 caracteres.");
      
      const confirmPass = prompt(`Confirme la nueva contraseña para ${user.username}:`);
      if (newPass !== confirmPass) return alert("Las contraseñas no coinciden.");

      try {
          await userService.changePassword(user.id, newPass);
          alert("Contraseña cambiada exitosamente. El usuario deberá iniciar sesión con la nueva contraseña.");
          
          if (isSelf) {
              authService.logout();
              navigate('/login');
          }
      } catch (e) {
          alert("Error al procesar el cambio.");
      }
  };

  const handleSuspend = async (user: SystemUser) => {
      if (user.id === currentUser?.id) {
          return alert("Regla de Seguridad: No puede suspender su propia cuenta de Administrador.");
      }
      
      const msg = user.status === 'SUSPENDED' 
        ? `¿Desea reactivar el acceso del usuario ${user.name}?`
        : `¿Está seguro de suspender el acceso del usuario ${user.name}? Esta acción puede mantenerse por tiempo indefinido.`;
        
      if (!confirm(msg)) return;

      try {
          if (user.status === 'SUSPENDED') {
              await userService.activate(user.id);
          } else {
              await userService.suspend(user.id);
          }
          await loadUsers();
      } catch (e) {
          alert("Error al actualizar el estado.");
      }
  };

  const handleDelete = async (user: SystemUser) => {
      if (user.id === currentUser?.id) {
          return alert("Regla de Seguridad: No puede eliminar su propia cuenta de Administrador.");
      }

      if (!confirm(`Advertencia: Esta acción eliminará al usuario ${user.name} y toda la información asociada. ¿Desea continuar?`)) return;

      try {
          await userService.delete(user.id);
          await loadUsers();
      } catch (e) {
          alert("Error al eliminar el registro.");
      }
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const roles: Record<UserRole, { label: string, color: string }> = {
      ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-700 border-red-200' },
      SUPERVISOR: { label: 'Supervisor', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      CAPTURA: { label: 'Captura', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      RESPONSABLE_BLH: { label: 'Resp. BLH', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      CAPTACION_DONADORAS: { label: 'Captación', color: 'bg-pink-100 text-pink-700 border-pink-200' },
      VERIFICACION_LOGISTICA: { label: 'Logística', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      ADMINISTRATIVO: { label: 'Administrativo', color: 'bg-slate-100 text-slate-700 border-slate-200' }
    };
    const { label, color } = roles[role] || { label: role, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-tighter ${color}`}>{label}</span>;
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
      if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-20" />;
      return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-primary-500" /> : <ChevronDown className="h-3 w-3 text-primary-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary-600" />
            Administración de Usuarios
          </h1>
          <p className="text-sm text-slate-500">Panel de control administrativo y gestión de credenciales.</p>
        </div>
        <Link to="/users/new">
          <Button className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, usuario o email..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th onClick={() => handleSort('id')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1">ID <SortIcon k="id" /></div>
                </th>
                <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1">Nombre Completo <SortIcon k="name" /></div>
                </th>
                <th className="px-6 py-4">Usuario / Acceso</th>
                <th onClick={() => handleSort('role')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1">Perfil <SortIcon k="role" /></div>
                </th>
                <th className="px-6 py-4">Estado</th>
                <th onClick={() => handleSort('registrationDate')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1">Último Acceso <SortIcon k="registrationDate" /></div>
                </th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-400 italic">Accediendo a registros maestros...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-medium">No hay usuarios que coincidan con la búsqueda.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs border border-white shadow-sm overflow-hidden">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{u.username}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        u.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {u.status === 'ACTIVE' ? 'Activo' : u.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {u.lastAccess ? new Date(u.lastAccess).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <button 
                            onClick={() => navigate(`/users/${u.id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" 
                            title="Ver Perfil"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link 
                            to={`/users/edit/${u.id}`} 
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all" 
                            title="Editar Datos Generales"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                          title="Cambiar Contraseña"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleSuspend(u)}
                          className={`p-1.5 rounded-md transition-all ${
                            u.status === 'SUSPENDED' ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={u.status === 'SUSPENDED' ? 'Reactivar Acceso' : 'Suspender Acceso'}
                        >
                          {u.status === 'SUSPENDED' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button 
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-100 rounded-md transition-all"
                            title="Eliminar Permanente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
              <p className="text-xs font-bold text-blue-800 uppercase">Reglas Administrativas</p>
              <ul className="text-xs text-blue-700 mt-1 list-disc list-inside space-y-1">
                  <li>El cambio de contraseña cierra la sesión del usuario para garantizar la seguridad.</li>
                  <li>Los usuarios <strong>Suspendidos</strong> conservan su historial pero no pueden acceder al sistema.</li>
                  <li>La <strong>Eliminación</strong> es una acción destructiva irreversible.</li>
              </ul>
          </div>
      </div>
    </div>
  );
};
