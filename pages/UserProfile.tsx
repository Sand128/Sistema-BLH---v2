
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Edit, Mail, MapPin, Calendar, 
  ShieldCheck, User as UserIcon, Hospital, 
  Lock, Clock, Activity, Building, Globe,
  Briefcase, CheckCircle, XCircle
} from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';
import { Button } from '../components/ui/Button';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (userId: string) => {
    try {
      const data = await userService.getById(userId);
      setUser(data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse italic">Cargando perfil institucional...</div>;
  if (!user) return <div className="p-12 text-center text-red-600 font-bold bg-red-50 rounded-xl mx-8 mt-8">El usuario solicitado no existe en los registros.</div>;

  const RoleLabel = ({ role }: { role: UserRole }) => {
    const labels: Record<UserRole, string> = {
      ADMIN: 'Administrador del Sistema',
      SUPERVISOR: 'Supervisor de Operaciones',
      CAPTURA: 'Analista de Captura',
      RESPONSABLE_BLH: 'Responsable del Banco de Leche',
      CAPTACION_DONADORAS: 'Captación y Seguimiento',
      VERIFICACION_LOGISTICA: 'Verificación y Logística',
      ADMINISTRATIVO: 'Personal Administrativo'
    };
    return <span>{labels[role] || role}</span>;
  };

  const InfoCard = ({ icon: Icon, label, value, color = "text-slate-500" }: any) => (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
              <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">{value || 'N/A'}</p>
          </div>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 relative">
            <button 
                onClick={() => navigate('/users')} 
                className="absolute top-4 left-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-sm"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="absolute top-4 right-4 flex gap-2">
                <Link to={`/users/edit/${user.id}`}>
                    <Button className="h-9 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md text-xs font-bold px-4">
                        <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                    </Button>
                </Link>
            </div>
        </div>
        
        <div className="px-8 pb-8">
            <div className="relative -mt-16 flex flex-col md:flex-row items-end gap-6 mb-6">
                <div className="h-32 w-32 rounded-3xl bg-white p-1 shadow-xl relative group">
                    <div className="h-full w-full rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 border border-slate-100 overflow-hidden">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                    </div>
                    {user.status === 'ACTIVE' ? (
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-white shadow-md" title="Cuenta Activa">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                    ) : (
                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 rounded-xl border-4 border-white shadow-md" title="Cuenta Inactiva">
                            <XCircle className="h-5 w-5" />
                        </div>
                    )}
                </div>
                <div className="flex-1 pb-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                        <p className="text-slate-500 font-bold text-sm flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            <RoleLabel role={user.role} />
                        </p>
                        <span className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></span>
                        <p className="text-slate-400 font-medium text-sm flex items-center gap-1.5 italic">
                            <Globe className="h-4 w-4" />
                            @{user.username}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Essential Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Información del Colaborador</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard icon={Mail} label="Correo Electrónico" value={user.email} color="text-pink-500" />
                            <InfoCard icon={Briefcase} label="Área de Adscripción" value={user.area} color="text-indigo-500" />
                            <InfoCard icon={Hospital} label="Coordinación / Unidad" value={user.coordination} color="text-emerald-500" />
                            <InfoCard icon={Building} label="Sector Institucional" value={user.sector} color="text-blue-500" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Seguridad y Auditoría</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard icon={Calendar} label="Fecha de Registro" value={new Date(user.registrationDate).toLocaleDateString()} />
                            <InfoCard icon={Clock} label="Último Acceso al Sistema" value={user.lastAccess ? new Date(user.lastAccess).toLocaleString() : 'Sin accesos registrados'} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Access Card */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                        <ShieldCheck className="h-10 w-10 text-primary-400 mb-4" />
                        <h4 className="text-lg font-black tracking-tight mb-2 uppercase italic opacity-90">Nivel de Acceso</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Módulo Administrativo</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                                <span className="text-slate-400 uppercase font-bold">Estado de Cuenta</span>
                                <span className={user.status === 'ACTIVE' ? 'text-emerald-400 font-black uppercase' : 'text-red-400 font-black uppercase'}>{user.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                                <span className="text-slate-400 uppercase font-bold">Privilegios</span>
                                <span className="font-black text-slate-200 uppercase">{user.role}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 uppercase font-bold">ID del Sistema</span>
                                <span className="font-mono text-slate-200 font-bold">#{user.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="h-4 w-4 text-primary-500" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Actividad Reciente</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="pl-4 border-l-2 border-slate-100 py-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Inicio de Sesión</p>
                                <p className="text-xs font-bold text-slate-700">Ayer, 14:22 PM</p>
                                <p className="text-[9px] text-slate-400 italic">IP: 192.168.1.104</p>
                            </div>
                            <div className="pl-4 border-l-2 border-slate-100 py-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Actualización de Perfil</p>
                                <p className="text-xs font-bold text-slate-700">15 de Mayo, 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
