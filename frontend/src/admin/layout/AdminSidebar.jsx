import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Map,
  Users,
  Bell,
  FileBarChart,
  LogOut,
  ShieldCheck,
  Globe,
  Settings
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore(); // Extract theme from store

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Claims', path: '/admin/claims', icon: FileText },
    { name: 'Land Verification', path: '/admin/land-verification', icon: ShieldCheck },
    { name: 'Field Assignments', path: '/admin/assignments', icon: Map },
    { name: 'Schemes', path: '/admin/schemes', icon: ShieldCheck },
    { name: 'Broadcasts', path: '/admin/broadcasts', icon: Bell },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: FileBarChart },
  ];


  const isDark = theme === 'dark';


  return (
    <div className={`h-screen w-64 border-r flex flex-col fixed left-0 top-0 z-50 shadow-2xl transition-colors duration-300
        ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>

      {/* Header */}
      <div className={`p-6 flex items-center space-x-3 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
          A
        </div>
        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Admin<span className="text-emerald-500">Panel</span>
        </span>
      </div>

      {/* Status Card */}
      <div className="px-4 py-4">
        <div className={`rounded-xl p-3 border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                   ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600 shadow-sm'}`}>
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                System Status
              </p>
              <div className="flex items-center mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                <span className="text-xs font-bold text-emerald-500">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
              ${isActive
                ? isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5 transition-colors" />
                <span>{item.name}</span>
                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-left text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
