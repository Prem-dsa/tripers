import { motion } from 'framer-motion';
import { Bell, MapPin, Sun, Moon, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { Avatar } from './index';

export function Navbar() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode, toggleNotificationPanel } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <header className="h-16 sm:h-20 px-3 sm:px-6 lg:px-8 flex items-center justify-between border-b border-[#E9E2FF] bg-white/85 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 gap-2">
      {/* Mobile Branding / Logo */}
      <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex items-center justify-center shadow-glow-sm">
          <MapPin size={14} className="text-white stroke-[2.5]" />
        </div>
        <div>
          <p className="font-extrabold text-[#1E1B4B] text-xs leading-none tracking-tight">Tripers</p>
          <p className="text-[#6D4AFF] text-[8px] font-bold tracking-wider mt-0.5">Split Smarter.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative group">
          <Search 
            size={14} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] group-focus-within:text-[#6D4AFF] transition-colors duration-300" 
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips, expenses, settlements..."
            className="w-full bg-[#F8F5FF] border border-[#E9E2FF] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/10 focus:bg-white transition-all duration-300 rounded-xl pl-11 pr-14 py-2.5 text-xs text-[#1E1B4B] placeholder:text-[#6B5CA5]/50 shadow-inner"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#6B5CA5] border border-[#E9E2FF] px-2 py-0.5 rounded-md bg-white pointer-events-none select-none font-mono tracking-wider">
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
          className="hidden sm:flex btn-icon text-[#6B5CA5] hover:text-[#6D4AFF] rounded-xl bg-[#F8F5FF] border-[#E9E2FF] flex-shrink-0"
          title="Toggle Theme"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        {/* Notifications */}
        <motion.button
          onClick={toggleNotificationPanel}
          className="btn-icon text-[#6B5CA5] hover:text-[#6D4AFF] relative rounded-xl bg-[#F8F5FF] border-[#E9E2FF] flex-shrink-0"
          title="Notifications"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full text-white text-[8px] flex-center font-bold border border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <div className="hidden sm:block h-5 w-px bg-[#E9E2FF] mx-1 flex-shrink-0" />

        {/* Profile Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="relative transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Avatar
            src={user?.photo}
            name={user?.fullName}
            size="sm"
            className="ring-2 ring-[#EDE8FF] hover:ring-[#6D4AFF]/30 rounded-full"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
