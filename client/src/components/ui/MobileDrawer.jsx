import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Compass, Plane, Receipt, Wallet, BarChart3,
  FileText, Sun, MapPin, Hotel, DollarSign, CheckSquare,
  Bell, Settings, User, LogOut, X, Sparkles, Navigation, Send
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { Avatar } from './index';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const mainNavItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/explore',     icon: Compass,         label: 'Explore' },
  { to: '/trips',       icon: Plane,           label: 'Trips' },
  { to: '/expenses',    icon: Receipt,         label: 'Expenses' },
  { to: '/settlements', icon: Wallet,          label: 'Settlements' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
];

const travelToolsItems = [
  { to: '/trips',       icon: FileText,    label: 'Documents' },
  { to: '/explore',     icon: Sun,         label: 'Weather' },
  { to: '/explore',     icon: MapPin,      label: 'Map' },
  { to: '/explore',     icon: Send,        label: 'Flights' },
  { to: '/explore',     icon: Hotel,       label: 'Hotels' },
  { to: '/settlements', icon: DollarSign,  label: 'Currency' },
  { to: '/trips',       icon: CheckSquare, label: 'Checklist' },
];

export function MobileDrawer() {
  const { user, logout } = useAuthStore();
  const { sidebarMobile, toggleMobileSidebar, toggleNotificationPanel } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarMobile) {
        toggleMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarMobile, toggleMobileSidebar]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toggleMobileSidebar();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleItemClick = (to) => {
    toggleMobileSidebar();
    if (to) navigate(to);
  };

  return (
    <AnimatePresence>
      {sidebarMobile && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleMobileSidebar}
            className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md"
          />

          {/* Slide Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) {
                toggleMobileSidebar();
              }
            }}
            className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] z-[101] flex flex-col shadow-2xl overflow-hidden rounded-r-[32px] border-r border-white/20 text-white select-none"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              paddingTop: 'env(safe-area-inset-top, 16px)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Logo & Close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow">
                  <MapPin size={18} className="text-white stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-[17px] tracking-tight leading-none">Tripers</p>
                  <p className="text-indigo-400 text-[9px] font-bold tracking-[0.2em] mt-1 uppercase">Liquid Glass</p>
                </div>
              </div>

              <button
                onClick={toggleMobileSidebar}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-b border-white/10 relative z-10">
              <div className="p-3.5 rounded-[22px] bg-white/8 border border-white/15 flex items-center gap-3">
                <Avatar src={user?.photo} name={user?.fullName} size="md" className="ring-2 ring-indigo-400/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[14px] font-extrabold truncate leading-tight">{user?.fullName}</p>
                  <p className="text-indigo-300 text-[11px] font-semibold truncate mt-0.5">@{user?.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Sparkles size={9} /> Explorer
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Dubai Trip 🇦🇪
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-5 relative z-10">
              {/* Main Nav */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">Navigation</p>
                <div className="space-y-0.5">
                  {mainNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => toggleMobileSidebar()}
                      className={({ isActive }) => clsx(
                        'relative group flex items-center gap-3.5 px-3.5 py-3 rounded-[16px] transition-all duration-200 min-h-[46px]',
                        isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/8'
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={18}
                            className={clsx(
                              'flex-shrink-0 transition-colors z-10',
                              isActive ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-200 stroke-2'
                            )}
                          />
                          <span className="text-[13px] z-10 tracking-wide flex-1">{item.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="mobileActiveBg"
                              className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 to-purple-500/15 rounded-[16px] border border-indigo-400/30"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Travel Tools */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">Travel Tools</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {travelToolsItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item.to)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-white/5 border border-white/10 hover:bg-white/12 transition-all text-left group"
                    >
                      <item.icon size={15} className="text-indigo-400 stroke-[2] flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-[12px] font-semibold text-slate-300 group-hover:text-white truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account & Settings */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">Account</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      toggleMobileSidebar();
                      toggleNotificationPanel();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-[16px] text-slate-400 hover:text-white hover:bg-white/8 transition-colors min-h-[46px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <Bell size={18} className="text-slate-400 stroke-2" />
                      <span className="text-[13px] font-medium tracking-wide">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <NavLink
                    to="/profile"
                    onClick={() => toggleMobileSidebar()}
                    className={({ isActive }) => clsx(
                      'relative group flex items-center gap-3.5 px-3.5 py-3 rounded-[16px] transition-all duration-200 min-h-[46px]',
                      isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/8'
                    )}
                  >
                    <Settings size={18} className="stroke-2 text-slate-400" />
                    <span className="text-[13px] tracking-wide">Settings</span>
                  </NavLink>

                  <NavLink
                    to="/profile"
                    onClick={() => toggleMobileSidebar()}
                    className={({ isActive }) => clsx(
                      'relative group flex items-center gap-3.5 px-3.5 py-3 rounded-[16px] transition-all duration-200 min-h-[46px]',
                      isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/8'
                    )}
                  >
                    <User size={18} className="stroke-2 text-slate-400" />
                    <span className="text-[13px] tracking-wide">My Profile</span>
                  </NavLink>
                </div>
              </div>
            </div>

            {/* Footer: Logout */}
            <div className="p-4 border-t border-white/10 relative z-10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[18px] bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all text-[13px] font-bold uppercase tracking-wider"
              >
                <LogOut size={16} className="stroke-[2.5]" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
