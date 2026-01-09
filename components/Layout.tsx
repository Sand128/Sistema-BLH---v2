
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, LogOut, User, Menu, X, Baby, 
  FlaskConical, ClipboardCheck, Archive, FileBarChart, 
  Bell, Moon, Sun, Settings, ChevronDown, CheckCircle, AlertCircle, Clock, Info,
  ThermometerSnowflake, ChevronRight, Circle, List, ShieldAlert, UserCircle,
  ClipboardList
} from 'lucide-react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { SystemNotification, NotificationModule } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  name: string;
  icon: any;
  path?: string;
  children?: NavItem[];
  adminOnly?: boolean;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openMenus, setOpenMenus] = useState<string[]>(['Recolección']);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
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
    if (notification.link) navigate(notification.link);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Donadoras', icon: Users, path: '/donors' },
    { 
      name: 'Recolección', 
      icon: ThermometerSnowflake,
      children: [
        { name: 'Registrar Frasco', icon: List, path: '/collection' },
        { name: 'Resumen Diario', icon: ClipboardList, path: '/daily-summary' },
      ]
    },
    { 
      name: 'Lotes', 
      icon: FlaskConical,
      children: [
        { name: 'Listado de Lotes', icon: List, path: '/batches' },
      ]
    },
    { name: 'Análisis', icon: ClipboardCheck, path: '/quality-control' },
    { name: 'Inventario', icon: Archive, path: '/inventory' },
    { name: 'Receptores', icon: Baby, path: '/recipients' },
    { name: 'Reportes', icon: FileBarChart, path: '/reports' },
    { 
      name: 'Administración', 
      icon: Settings,
      adminOnly: true,
      children: [
        { name: 'Usuarios', icon: ShieldAlert, path: '/users' },
      ]
    }
  ];

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-r ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-center h-20 border-b shrink-0 border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-pink-500 p-2 rounded-lg shadow-lg">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">BLH Digital</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute right-4 text-gray-500"><X className="h-6 w-6" /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.children) {
              const isOpen = openMenus.includes(item.name);
              const isChildActive = item.children.some(child => location.pathname.startsWith(child.path || ''));
              return (
                <div key={item.name} className="space-y-1">
                  <button onClick={() => toggleMenu(item.name)} className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all ${isChildActive && !isOpen ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isChildActive ? 'text-pink-600' : 'text-gray-400'}`} />
                      {item.name}
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {isOpen && (
                    <div className="pl-4 space-y-1 relative animate-in slide-in-from-top-1">
                      <div className="absolute left-[22px] top-0 bottom-2 w-0.5 bg-gray-200"></div>
                      {item.children.map(child => (
                        <Link key={child.name} to={child.path!} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ml-2 ${location.pathname.startsWith(child.path!) ? 'bg-pink-100/50 text-pink-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                          {location.pathname.startsWith(child.path!) ? <Circle className="h-2 w-2 fill-current" /> : <span className="w-2 h-2" />}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path!} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all ${isActive ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
           <Link to="/settings" className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors ${location.pathname === '/settings' ? 'bg-pink-50 ring-1 ring-pink-100' : ''}`}>
              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold border border-white shadow-sm overflow-hidden">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">{user?.role}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
           </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 shadow-sm flex items-center justify-between px-6 lg:px-8 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu className="h-6 w-6" /></button>
            <img src="/components/image/logos_edomex.png" alt="Edomex" className="h-12 sm:h-16 object-contain" />
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r pr-6 border-gray-200">
              <h1 className="text-xl font-bold text-pink-700 leading-tight">Banco de Leche Humana</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 uppercase tracking-tighter">
                <Clock className="h-3 w-3" />
                {currentDate.toLocaleTimeString()}
              </div>
            </div>

            <div className="relative" ref={notificationRef}>
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full relative text-gray-500 hover:bg-gray-100">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ring-2 ring-white text-[10px] font-bold text-white animate-pulse">{unreadCount}</span>}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4 border-b border-gray-100 font-bold text-sm">Notificaciones</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs italic">Sin notificaciones</div> : notifications.map(n => (
                      <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-pink-50/20' : ''}`}>
                         <p className="text-xs font-bold text-slate-800">{n.title}</p>
                         <p className="text-[10px] text-slate-500 line-clamp-2">{n.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="p-2 rounded-full text-red-500 hover:bg-red-50" title="Cerrar Sesión"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
