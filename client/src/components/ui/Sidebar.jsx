import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Plane, Receipt, BarChart3,
  LogOut, X, ChevronLeft, Wallet, Compass, MapPin, User, Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar } from './index';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips',       icon: Plane,            label: 'My Trips' },
  { to: '/expenses',    icon: Receipt,          label: 'Expenses' },
  { to: '/settlements', icon: Wallet,           label: 'Settlements' },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics' },
  { to: '/explore',     icon: Compass,          label: 'Explore' },
];

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, sidebarMobile, toggleMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="h-full flex flex-col justify-between py-2">
      <div>
        {/* Logo */}
        <div className="pb-5 mb-4 border-b border-slate-200 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] flex-center shadow-glow-sm flex-shrink-0 animate-float">
              <MapPin size={18} className="text-white stroke-[2.5]" />
            </div>
            <AnimatePresence>
              {(sidebarOpen || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-extrabold text-[#0F172A] text-sm leading-none tracking-tight">Tripers</p>
                  <p className="text-[#4F46E5] text-[9px] font-bold tracking-wider mt-1">Split Smarter.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex btn-icon text-slate-500 hover:text-[#4F46E5]"
            >
              <ChevronLeft size={16} className={clsx('transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 overflow-y-auto no-scrollbar px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={isMobile ? toggleMobileSidebar : undefined}
              className={({ isActive }) => clsx(
                'relative group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 min-h-[46px] overflow-hidden',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#4F46E5]'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 transition-all duration-300 z-10',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#4F46E5]'
                    )}
                  />
                  <AnimatePresence>
                    {(sidebarOpen || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px] font-semibold z-10 truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <>
                      <motion.div
                        layoutId={isMobile ? "activePillMobile" : "activePill"}
                        className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] shadow-glow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                      <motion.div
                        layoutId={isMobile ? "activeLineMobile" : "activeLine"}
                        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md z-20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="space-y-3 px-1">
        <div className="border-t border-slate-200 pt-3 space-y-1.5">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={isMobile ? toggleMobileSidebar : undefined}
              className={({ isActive }) => clsx(
                'relative group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 min-h-[46px] overflow-hidden',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#4F46E5]'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 z-10 transition-all duration-300',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#4F46E5]'
                    )}
                  />
                  <AnimatePresence>
                    {(sidebarOpen || isMobile) && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-semibold z-10 truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <>
                      <motion.div layoutId={isMobile ? "activePillBottomMobile" : "activePillBottom"} className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] shadow-glow-sm" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                      <motion.div layoutId={isMobile ? "activeLineBottomMobile" : "activeLineBottom"} className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md z-20" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card */}
        <div className={clsx('p-2.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-2.5 transition-all duration-300', !(sidebarOpen || isMobile) && 'justify-center')}>
          <Avatar src={user?.photo} name={user?.fullName} size="sm" className="ring-2 ring-slate-100 flex-shrink-0" />
          <AnimatePresence>
            {(sidebarOpen || isMobile) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-[#0F172A] text-xs font-bold truncate leading-none">{user?.fullName}</p>
                <p className="text-slate-500 text-[10px] truncate mt-1">@{user?.username}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {(sidebarOpen || isMobile) && (
            <button
              onClick={handleLogout}
              className="btn-icon w-8 h-8 hover:bg-red-50 hover:text-red-600 text-slate-500 flex-shrink-0"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col h-screen p-4 flex-shrink-0 z-35 bg-white border-r border-slate-200 shadow-sm"
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 w-72 bg-white p-4 z-50 lg:hidden shadow-2xl flex flex-col border-r border-slate-200"
            >
              {/* Header Close button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={toggleMobileSidebar}
                  className="btn-icon text-slate-500 hover:text-[#4F46E5] hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 mt-2">
                <SidebarContent isMobile={true} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
