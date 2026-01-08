
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, Mail, Lock, Camera, Save, 
  X, CheckCircle, AlertCircle, Eye, EyeOff, Shield,
  Fingerprint, Briefcase, Hospital
} from 'lucide-react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Visibility toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatarUrl: currentUser?.avatarUrl || ''
  });

  const [photoPreview, setPhotoPreview] = useState<string>(currentUser?.avatarUrl || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError("La foto debe ser uno de los formatos permitidos (JPG, JPEG, PNG, GIF).");
      return;
    }

    // Validation: Size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La foto debe pesar máximo 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setFormData(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError('');
    setSuccess('');

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("El correo electrónico ingresado no es válido.");
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (!formData.currentPassword) {
        setError("Debe ingresar su contraseña actual para realizar cambios de seguridad.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Update in the main user service
      const updatedUser = await userService.update(currentUser.id, {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl
      });

      // 2. Update password if provided
      if (formData.newPassword) {
        await userService.changePassword(currentUser.id, formData.newPassword);
      }

      // 3. Update session
      authService.updateCurrentUser(updatedUser);
      
      setSuccess("Se ha actualizado correctamente tu información de perfil.");
      
      // Limpiar campos de password
      setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
      }));

    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración de Perfil</h1>
        <p className="text-slate-500 mt-1">Actualiza tu información y configuración de cuenta</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-sm text-emerald-800 font-bold">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in shake">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800 font-bold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Photo & Read-only Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="relative inline-block group">
              <div className="h-32 w-32 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 border-4 border-white shadow-xl overflow-hidden mb-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-xl border-4 border-white shadow-lg hover:bg-primary-700 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoChange} 
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              JPG, PNG o GIF • Máx 2MB
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Fingerprint className="h-5 w-5 text-primary-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID de Sistema</p>
                <p className="font-mono text-sm">#{currentUser.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario de Acceso</p>
                <p className="font-bold text-sm">@{currentUser.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editable Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary-500" />
                Información Personal
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <Input 
                label="Nombre Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input 
                label="Correo Electrónico Institucional"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Área</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" /> {currentUser.area}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Coordinación</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Hospital className="h-3.5 w-3.5" /> {currentUser.coordination}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-500" />
                Seguridad de la Cuenta
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Contraseña Actual</label>
                <div className="relative">
                  <input 
                    type={showCurrentPass ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Ingrese su contraseña actual para validar cambios"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nueva Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showNewPass ? "text" : "password"}
                      name="newPassword"
                      placeholder="Mín. 8 caracteres"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-[#C6C6C6] bg-white rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Confirmar Contraseña</label>
                  <input 
                    type="password"
                    name="confirmPassword"
                    placeholder="Repita la contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#C6C6C6] bg-white rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
              className="px-8"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              isLoading={loading}
              className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
