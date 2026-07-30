import { motion } from 'framer-motion';
import { Bell, MapPin, Search, Plus, Menu, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { Avatar } from './index';

export function Navbar() {
  const { user } = useAuthStore();
  const { toggleNotificationPanel, toggleMobileSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px] select-none"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Left: Hamburger (Mobile/Tablet) + Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Hamburger Menu Button */}
        <motion.button
          onClick={toggleMobileSidebar}
          className="lg:hidden w-10 h-10 rounded-[14px] bg-white/10 hover:bg-white/18 flex items-center justify-center text-slate-200 hover:text-white border border-white/15 transition-all shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open mobile menu"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </motion.button>

        {/* Mobile/Tablet Branding */}
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow flex-shrink-0">
            <MapPin size={18} className="text-white stroke-[2.5]" />
          </div>
          <div className="hidden sm:block lg:hidden">
            <p className="font-extrabold text-white text-[16px] leading-none tracking-tight">Tripers</p>
            <p className="text-indigo-300 text-[9px] font-bold tracking-widest uppercase mt-0.5">Liquid Glass</p>
          </div>
        </div>

        {/* Active Travel Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold tracking-wide">
          <Sparkles size={12} className="text-indigo-400" />
          <span>Dubai Trip 🇦🇪 Active</span>
        </div>
      </div>

      {/* Search Bar (Tablet / Desktop) */}
      <div className="flex-1 max-w-lg hidden md:block mx-4">
        <div className="relative group">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations, trips, expenses..."
            className="w-full bg-white/8 backdrop-blur-md border border-white/15 focus:border-indigo-400/60 focus:bg-white/12 transition-all duration-200 rounded-[20px] pl-10 pr-12 py-2.5 text-[13px] text-white placeholder:text-slate-500 outline-none"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-white/8 border border-white/15 px-2 py-0.5 rounded-md pointer-events-none select-none font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        {/* Quick New Trip (Desktop) */}
        <motion.button
          onClick={() => navigate('/trips/new')}
          className="hidden lg:flex btn-primary text-[12px] font-bold px-5 py-2.5 rounded-full gap-1.5 shadow-glow items-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={15} className="stroke-[2.5]" />
          <span className="uppercase tracking-wider">New Trip</span>
        </motion.button>

        {/* Notifications */}
        <motion.button
          onClick={toggleNotificationPanel}
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-white/15 hover:bg-white/18 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 shadow-sm"
          title="Notifications"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={18} className="stroke-[2.2]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 shadow-glow"
            />
          )}
        </motion.button>

        {/* Profile Avatar (Mobile/Tablet) */}
        <button
          onClick={() => navigate('/profile')}
          className="lg:hidden relative transition-all duration-200 hover:scale-105"
          title="My Profile"
        >
          <Avatar
            src={user?.photo}
            name={user?.fullName}
            size="sm"
            className="ring-2 ring-indigo-400/50 shadow-md"
          />
        </button>
      </div>
    </header>
  );
}
