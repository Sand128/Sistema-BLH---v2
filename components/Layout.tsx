
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, LogOut, User, Menu, X, Baby, 
  FlaskConical, ClipboardCheck, Archive, FileBarChart, 
  Bell, Moon, Sun, Settings, ChevronDown, CheckCircle, AlertCircle, Clock, Info,
  ThermometerSnowflake, ChevronRight, Circle, List
} from 'lucide-react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { SystemNotification, NotificationModule } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

// Estructura para el menú jerárquico
type NavItem = {
  name: string;
  icon: any;
  path?: string;
  children?: NavItem[];
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  
  // States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for collapsible menus (stores names of open parent menus)
  // Default 'Lotes' open to show the hierarchy immediately
  const [openMenus, setOpenMenus] = useState<string[]>(['Lotes']);
  
  // Notification State
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications Fetch Effect
  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await notificationService.getAll();
      setNotifications(data);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-expand menu if active route is inside a parent
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          child.path && (location.pathname === child.path || location.pathname.startsWith(child.path))
        );
        if (hasActiveChild && !openMenus.includes(item.name)) {
          setOpenMenus(prev => [...prev, item.name]);
        }
      }
    });
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    notificationService.markAsRead(notification.id);
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    setIsNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    unreadIds.forEach(id => notificationService.markAsRead(id));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- CONFIGURACIÓN DEL MENÚ ---
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Donadoras', icon: Users, path: '/donors' },
    { 
      name: 'Lotes', // Renamed form Gestión de Lotes
      icon: FlaskConical,
      children: [
        { name: 'Listado de Lotes', icon: List, path: '/batches' },
        { name: 'Nuevo Frasco', icon: ThermometerSnowflake, path: '/collection' }, // Renamed from Recolección
      ]
    },
    { name: 'Análisis', icon: ClipboardCheck, path: '/quality-control' }, // Separated to top level
    { name: 'Inventario', icon: Archive, path: '/inventory' },
    { name: 'Receptores', icon: Baby, path: '/recipients' },
    { name: 'Reportes', icon: FileBarChart, path: '/reports' },
  ];

  const formattedDate = currentDate.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedTime = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const getNotificationIcon = (module: NotificationModule) => {
    switch(module) {
      case 'QUALITY': return <ClipboardCheck className="h-5 w-5 text-purple-500" />;
      case 'INVENTORY': return <Archive className="h-5 w-5 text-orange-500" />;
      case 'DONORS': return <Users className="h-5 w-5 text-pink-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
        border-r ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col
      `}>
        <div className={`flex items-center justify-center h-20 border-b shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="bg-pink-500 p-2 rounded-lg shadow-lg shadow-pink-500/30">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              BLH Digital
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute right-4 text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            
            // Render logic for items WITH children (Parent)
            if (item.children) {
              const isOpen = openMenus.includes(item.name);
              // Check if any child is active to highlight parent
              const isChildActive = item.children.some(child => 
                child.path && (location.pathname === child.path || location.pathname.startsWith(child.path))
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isChildActive && !isOpen
                        ? 'bg-pink-50 text-pink-700'
                        : isDarkMode 
                          ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isChildActive ? 'text-pink-600' : 'text-gray-400'}`} />
                      {item.name}
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* Submenu */}
                  {isOpen && (
                    <div className="pl-4 space-y-1 relative animate-in slide-in-from-top-1 duration-200">
                      {/* Vertical line connector */}
                      <div className={`absolute left-[22px] top-0 bottom-2 w-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                      
                      {item.children.map(child => {
                        const isSubActive = child.path && (location.pathname === child.path || location.pathname.startsWith(child.path));
                        return (
                          <Link
                            key={child.name}
                            to={child.path!}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ml-2 ${
                              isSubActive
                                ? 'bg-pink-100/50 text-pink-700'
                                : isDarkMode
                                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {/* Horizontal connector or simple dot */}
                            {isSubActive ? <Circle className="h-2 w-2 fill-current" /> : <span className="w-2 h-2" />}
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Render logic for simple items (No children)
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path || ''));
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-pink-50 text-pink-700 shadow-sm'
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        
        {/* User Info Footer in Sidebar */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
           <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                 {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                 <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                 <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className={`
          relative z-30 h-24 shadow-sm flex items-center justify-between px-6 lg:px-8 transition-colors
          ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-gradient-to-r from-pink-50 via-white to-white'}
        `}>
          
          {/* Left: Mobile Toggle & Institutional Logo */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu className="h-6 w-6" />
            </button>
            <img 
              src="logos_edomex.png" 
              alt="Gobierno del Estado de México" 
              className="h-12 sm:h-16 object-contain"
            />
          </div>

          {/* Right: System Info & Actions */}
          <div className="flex items-center gap-6 md:gap-8">
            
            <div className="hidden md:flex flex-col items-end text-right mr-4 border-r pr-6 border-gray-200">
              <h1 className="text-xl font-bold text-pink-700 leading-tight">Banco de Leche Humana</h1>
              <span className={`text-xs font-medium tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Sistema de Control de Lactancia
              </span>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span className="capitalize">{formattedDate}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="font-mono">{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              
              {/* Notifications Component */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-full relative transition-colors ${
                    isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} nuevas)` : ''}`}
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ring-2 ring-white text-[10px] font-bold text-white animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                        >
                          Marcar todo leído
                        </button>
                      )}
                    </div>
                    <div className="max-h-[28rem] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                          <CheckCircle className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-sm">No tienes notificaciones nuevas.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start ${!notification.isRead ? 'bg-pink-50/40' : ''}`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                {getNotificationIcon(notification.module)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && <span className="h-2 w-2 rounded-full bg-pink-500 mt-1.5 flex-shrink-0"></span>}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                                  {notification.description}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                      <Link to="/reports" onClick={() => setIsNotificationsOpen(false)} className="text-xs font-medium text-pink-600 hover:text-pink-800">
                        Ver análisis completo
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-3 pl-4 border-l ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} transition-opacity hover:opacity-80`}
              >
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-pink-600 font-medium">
                    {user?.role === 'ADMIN' ? 'Coordinación' : 'Personal Salud'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shadow-md">
                   {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="User" className="h-full w-full rounded-full object-cover border-2 border-white" />
                   ) : (
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <User className="h-5 w-5 text-pink-500" />
                      </div>
                   )}
                </div>
                <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              </button>

              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className={`absolute right-0 mt-3 w-56 rounded-xl shadow-2xl py-2 z-20 ring-1 ring-black ring-opacity-5 transform transition-all ${
                    isDarkMode ? 'bg-slate-800 ring-slate-700' : 'bg-white'
                  }`}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} mb-1`}>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Conectado como</p>
                      <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                    </div>
                    
                    <button className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <User className="h-4 w-4" /> Mi Perfil
                    </button>
                    <button className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Settings className="h-4 w-4" /> Configuración
                    </button>
                    
                    <div className={`border-t my-1 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 relative">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};
