import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react';

const AdminLayout = () => {
  const { theme, toggleTheme } = useThemeStore();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = user.role === 'admin';

  // Apply theme to body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  if (!isAuthenticated && !isAdmin) {
      // return <Navigate to="/auth" replace />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300
        ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      <AdminSidebar />
      
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className={`flex justify-between items-center mb-8 backdrop-blur-md sticky top-0 z-30 py-4 px-6 -mx-6 transition-colors duration-300
             ${isDark ? 'bg-slate-900/80 border-b border-transparent' : 'bg-white/80 border-b border-slate-200/50'}`}>
            <div>
                 <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Overview
                 </h1>
                 <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Welcome back, Administrator
                 </p>
            </div>
            
            <div className="flex items-center space-x-6">
                
               {/* Theme Toggle */}
               <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 shadow-sm border
                    ${isDark 
                        ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
               >
                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>

               <div className="flex items-center space-x-4 border-l pl-6 border-slate-700/20">
                    <div className="text-right hidden md:block">
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {user.full_name || 'Admin User'}
                            </p>
                            <p className="text-xs text-emerald-500 font-medium">Super Admin</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 p-[2px]">
                        <div className={`h-full w-full rounded-full flex items-center justify-center font-bold
                            ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
                                AD
                        </div>
                    </div>
               </div>
            </div>
        </header>

        <div className="animate-fade-in-up">
            <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
