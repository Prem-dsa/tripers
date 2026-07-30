import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Compass, Receipt, Wallet, BarChart3,
  LogOut, MapPin, User, ChevronLeft, ChevronRight, Plane
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar } from './index';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/explore',     icon: Compass,         label: 'Explore' },
  { to: '/trips',       icon: Plane,           label: 'Trips' },
  { to: '/expenses',    icon: Receipt,         label: 'Expenses' },
  { to: '/settlements', icon: Wallet,          label: 'Settlements' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/profile',     icon: User,            label: 'Profile' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <motion.aside
      className={clsx(
        'hidden md:flex flex-col h-full flex-shrink-0 z-30 py-3 pl-3 transition-all duration-300',
        sidebarOpen ? 'w-[240px] xl:w-[260px]' : 'w-[80px]'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="bg-slate-900/90 backdrop-blur-[36px] border border-white/20 h-full rounded-[32px] flex flex-col py-4 px-3 shadow-2xl relative overflow-hidden text-white">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full gap-2">
          {/* Logo & Toggle */}
          <div className={clsx(
            'px-2 pb-3 mb-1 flex items-center justify-between border-b border-white/10',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow flex-shrink-0">
                <MapPin size={18} className="text-white stroke-[2.5]" />
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="font-extrabold text-white text-[17px] tracking-tight leading-none truncate">Tripers</p>
                  <p className="text-indigo-400/80 text-[9px] font-bold tracking-[0.2em] mt-1 uppercase truncate">Liquid Glass</p>
                </div>
              )}
            </div>

            {/* Collapse Toggle for Tablet / Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar px-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) => clsx(
                  'relative group flex items-center gap-3 px-3 py-3 rounded-[18px] transition-all duration-200 min-h-[48px]',
                  !sidebarOpen && 'justify-center px-0',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-400 font-medium hover:bg-white/8 hover:text-white'
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      className={clsx(
                        'flex-shrink-0 transition-all duration-200 z-10',
                        isActive ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-200 stroke-2'
                      )}
                    />
                    {sidebarOpen && (
                      <span className="text-[13px] z-10 tracking-wide flex-1 truncate">{item.label}</span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarNavBg"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 to-purple-500/15 rounded-[18px] border border-indigo-400/30"
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Card */}
          <div className="pt-2 border-t border-white/10 mt-auto">
            <div className={clsx(
              'p-2 rounded-[20px] bg-white/8 border border-white/15 flex items-center gap-2.5 hover:bg-white/12 transition-all duration-200',
              !sidebarOpen && 'justify-center p-1.5'
            )}>
              <Avatar src={user?.photo} name={user?.fullName} size="sm" className="ring-2 ring-indigo-400/50 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[12px] font-bold truncate leading-none">{user?.fullName}</p>
                  <p className="text-indigo-300 text-[10px] font-medium truncate mt-0.5">@{user?.username}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut size={13} className="stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
