import { motion } from 'framer-motion';
import { Bell, MapPin, Sun, Moon, Search, Plus, Menu } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { Avatar } from './index';

export function Navbar() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode, toggleNotificationPanel, toggleMobileSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <header className="h-16 sm:h-20 px-3 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 gap-2">
      {/* Mobile Branding / Logo */}
      <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors mr-0.5"
          aria-label="Toggle Menu"
        >
          <Menu size={20} className="stroke-[2.5]" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] flex items-center justify-center shadow-glow-sm">
          <MapPin size={14} className="text-white stroke-[2.5]" />
        </div>
        <div>
          <p className="font-extrabold text-[#0F172A] text-xs leading-none tracking-tight">Tripers</p>
          <p className="text-[#4F46E5] text-[8px] font-bold tracking-wider mt-0.5">Split Smarter.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative group">
          <Search 
            size={14} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#4F46E5] transition-colors duration-300" 
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips, expenses, settlements..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 focus:bg-white transition-all duration-300 rounded-xl pl-11 pr-14 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 shadow-inner"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md bg-white pointer-events-none select-none font-mono tracking-wider">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3.5 ml-auto flex-shrink-0">
        {/* Quick add */}
        <motion.button
          onClick={() => navigate('/trips/new')}
          className="hidden sm:flex btn-primary btn text-[10px] tracking-wider font-bold uppercase px-2.5 sm:px-4 py-2 sm:py-2.5 gap-0 sm:gap-2 rounded-xl shadow-glow-sm flex-shrink-0"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span className="hidden sm:inline">Quick Add</span>
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleDarkMode}
          className="hidden sm:flex btn-icon text-slate-500 hover:text-[#4F46E5] rounded-xl bg-slate-50 border-slate-200 flex-shrink-0"
          title="Toggle Theme"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        {/* Notifications */}
        <motion.button
          onClick={toggleNotificationPanel}
          className="btn-icon text-slate-500 hover:text-[#4F46E5] relative rounded-xl bg-slate-50 border-slate-200 flex-shrink-0"
          title="Notifications"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] rounded-full text-white text-[8px] flex-center font-bold border border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1 flex-shrink-0" />

        {/* Profile Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="relative transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Avatar
            src={user?.photo}
            name={user?.fullName}
            size="sm"
            className="ring-2 ring-slate-100 hover:ring-[#4F46E5]/30 rounded-full"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
