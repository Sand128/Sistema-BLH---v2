
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Moon, Sun, Baby, HeartPulse } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas. Intente: admin@blh.com / admin');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Clases dinámicas según el tema
  const themeClasses = {
    container: isDarkMode 
      ? 'bg-slate-900 text-slate-100' 
      : 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 text-slate-800',
    card: isDarkMode
      ? 'bg-slate-800 border-slate-700 shadow-slate-900/50'
      : 'bg-white/80 backdrop-blur-lg border-white shadow-xl shadow-pink-100/50',
    inputBg: isDarkMode
      ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-pink-500'
      : 'bg-[#F2F4F7] border-[#C6C6C6] text-[#333333] placeholder-[#9A9A9A] focus:border-pink-500',
    inputIcon: isDarkMode ? 'text-slate-500' : 'text-gray-400',
    heading: isDarkMode ? 'text-pink-400' : 'text-pink-600',
    subheading: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    logoText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    button: 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/30 transition-all transform hover:scale-[1.02]',
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${themeClasses.container}`}>
      
      {/* Botón de cambio de tema (Flotante) */}
      <button 
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all ${
          isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-50'
        }`}
        aria-label="Alternar modo oscuro"
      >
        {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      {/* Lado Izquierdo: Formulario */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between px-8 sm:px-12 lg:px-16 xl:px-24 relative z-10 py-8">
        
        {/* Encabezado con Imagen Institucional */}
        <div className="w-full mb-8">
           <img 
             src="/components/image/logos_isem.png" 
             alt="Gobierno del Estado de México - Salud - ISEM" 
             className="h-16 sm:h-20 object-contain mx-auto lg:mx-0"
           />
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Encabezado del Formulario */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-pink-100 rounded-2xl">
                 <HeartPulse className="h-8 w-8 text-pink-600" />
               </div>
               <h1 className={`text-3xl font-bold ${themeClasses.heading}`}>Bienvenido</h1>
            </div>
            <p className={`text-lg ${themeClasses.subheading}`}>
              Sistema de Control de Lactancia Materna
            </p>
          </div>

          {/* Tarjeta de Login */}
          <div className={`p-8 rounded-3xl border ${themeClasses.card} transition-all duration-300`}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}
              
              {/* Campo Usuario */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ml-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Usuario
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${themeClasses.inputIcon}`}>
                    <User className="h-5 w-5 transition-colors group-focus-within:text-pink-500" />
                  </div>
                  <input
                    type="email"
                    required
                    className={`block w-full pl-11 pr-4 py-4 rounded-md border outline-none transition-all duration-300 text-base ${themeClasses.inputBg}`}
                    placeholder="admin@blh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ml-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Contraseña
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${themeClasses.inputIcon}`}>
                    <Lock className="h-5 w-5 transition-colors group-focus-within:text-pink-500" />
                  </div>
                  <input
                    type="password"
                    required
                    className={`block w-full pl-11 pr-4 py-4 rounded-md border outline-none transition-all duration-300 text-base ${themeClasses.inputBg}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 rounded-md text-lg font-bold tracking-wide ${themeClasses.button} flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Acceder al sistema"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Pie de Página con Imagen */}
        <div className="mt-8 w-full max-w-md mx-auto">
             <p className={`text-center text-sm mb-4 ${themeClasses.subheading}`}>
               © {new Date().getFullYear()} Banco de Leche Humana. Todos los derechos reservados.
             </p>
             <img 
               src="/components/image/cintillo.svg" 
               alt="Decoración Institucional" 
               className="w-full object-contain"
             />
        </div>

      </div>

      {/* Lado Derecho: Imagen Ilustrativa */}
      <div className="hidden lg:block w-7/12 relative overflow-hidden">
        {/* Imagen de fondo (Madre y bebé - concepto lactancia) */}
        <img 
          src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=2574&auto=format&fit=crop" 
          alt="Madre amamantando a su bebé en un ambiente cálido y seguro" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] hover:scale-105"
        />
        
        {/* Gradiente Overlay para integrar con el diseño */}
        <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-slate-900 via-slate-900/60 to-transparent' : 'from-pink-100 via-purple-100/40 to-transparent'} mix-blend-multiply`}></div>
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-slate-900 via-transparent' : 'from-blue-100 via-transparent'} opacity-60`}></div>

        {/* Mensaje inspirador flotante */}
        <div className="absolute bottom-16 right-16 max-w-md text-right">
           <div className={`inline-block p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl ${isDarkMode ? 'bg-slate-900/40 text-white' : 'bg-white/30 text-white'}`}>
              <Baby className="h-10 w-10 mb-4 ml-auto" />
              <h3 className="text-2xl font-bold mb-2">Nutriendo el futuro</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                "La lactancia materna es el primer paso hacia una vida saludable y llena de amor."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
