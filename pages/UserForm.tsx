
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Save, ShieldCheck, User as UserIcon, 
  Mail, Hospital, Key, AlertCircle, Info, Building,
  Briefcase
} from 'lucide-react';
import { userService } from '../services/userService';
import { HOSPITALS } from '../services/hospitalData';
import { User, UserRole } from '../types';
import { Button } from '../components/ui/Button';

const ROLES: { value: UserRole, label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'CAPTURA', label: 'Captura' },
  { value: 'RESPONSABLE_BLH', label: 'Responsable del BLH' },
  { value: 'CAPTACION_DONADORAS', label: 'Captación y Seguimiento de Donadoras' },
  { value: 'VERIFICACION_LOGISTICA', label: 'Verificación / Logística' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' }
];

export const UserForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: '' as UserRole,
    sector: 'ISEM', 
    coordination: '',
    area: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      userService.getById(id).then(user => {
        if (user) {
          setFormData({
            ...formData,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            coordination: user.coordination,
            area: user.area
          });
        }
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name || !formData.username || !formData.email || !formData.role || !formData.coordination || !formData.area) {
      return 'Todos los campos marcados con * son obligatorios.';
    }
    
    if (/\s/.test(formData.username)) {
      return 'El nombre de usuario no puede contener espacios.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El formato del correo electrónico es inválido.';
    }

    if (!isEdit) {
      if (formData.password.length < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Las contraseñas no coinciden.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        await userService.update(id, {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          coordination: formData.coordination,
          area: formData.area
        });
      } else {
        await userService.create({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          sector: 'ISEM',
          coordination: formData.coordination,
          area: formData.area
        }, formData.password);
      }
      navigate('/users');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all";
  const labelClass = "block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {isEdit ? 'Editar Perfil de Usuario' : 'Crear Nuevo Usuario'}
          </h1>
          <p className="text-sm text-slate-500">Defina los privilegios y ubicación del colaborador.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 font-bold">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary-500" />
              Información General - Usuario del Sistema
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Nombre Completo <span className="text-red-500">*</span></label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Ej. Juan Pérez López"
              />
            </div>
            <div>
              <label className={labelClass}>Nombre de Usuario <span className="text-red-500">*</span></label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="jperez"
              />
              <p className="mt-1 text-[10px] text-slate-400">Sin espacios, único en el sistema.</p>
            </div>
            <div>
              <label className={labelClass}>Correo Electrónico <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  className={`${inputClass} pl-10`} 
                  placeholder="ejemplo@salud.gob.mx"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Perfil / Rol <span className="text-red-500">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione un rol...</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Building className="h-4 w-4 text-primary-500" />
              Organización
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Sector (Solo lectura)</label>
              <input 
                name="sector" 
                value={formData.sector} 
                readOnly 
                className={`${inputClass} bg-slate-100 font-bold text-slate-500`} 
              />
            </div>
            <div>
              <label className={labelClass}>Coordinación (Hospital / BLH) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Hospital className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select name="coordination" value={formData.coordination} onChange={handleChange} className={`${inputClass} pl-10`}>
                  <option value="">Seleccione coordinación...</option>
                  {HOSPITALS.map(h => <option key={h.initials} value={h.initials}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                  <Briefcase className="h-3 w-3" /> Área de Adscripción <span className="text-red-500">*</span>
              </label>
              <input 
                name="area" 
                value={formData.area} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Ej. Lactario, Control de Calidad, etc."
              />
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Key className="h-4 w-4 text-primary-500" />
                Credenciales
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Contraseña <span className="text-red-500">*</span></label>
                <input 
                  name="password" 
                  type="password"
                  value={formData.password} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className={labelClass}>Repetir Contraseña <span className="text-red-500">*</span></label>
                <input 
                  name="confirmPassword" 
                  type="password"
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className={inputClass} 
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-3">
             <Info className="h-5 w-5 text-blue-500" />
             <p className="text-xs text-blue-700 font-medium">Al crear el usuario, se activará de forma inmediata para el acceso al sistema.</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancelar</Button>
            <Button type="submit" isLoading={loading} className="bg-primary-600 hover:bg-primary-700">
               <Save className="h-4 w-4 mr-2" />
               {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
