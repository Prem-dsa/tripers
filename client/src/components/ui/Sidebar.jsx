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
  { to: '/settings', icon: Settings, label: 'Settings' },
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

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between py-2">
      <div>
        {/* Logo */}
        <div className="pb-5 mb-4 border-b border-[#E9E2FF] flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex-center shadow-glow-sm flex-shrink-0 animate-float">
              <MapPin size={18} className="text-white stroke-[2.5]" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-extrabold text-[#1E1B4B] text-sm leading-none tracking-tight">Tripers</p>
                  <p className="text-[#6D4AFF] text-[9px] font-bold tracking-wider mt-1">Split Smarter.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex btn-icon text-[#6B5CA5] hover:text-[#6D4AFF]"
          >
            <ChevronLeft size={16} className={clsx('transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 overflow-y-auto no-scrollbar px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'relative group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 min-h-[46px] overflow-hidden',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-[#6B5CA5] hover:bg-[#F3F0FF] hover:text-[#6D4AFF]'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 transition-all duration-300 z-10',
                      isActive ? 'text-white' : 'text-[#6B5CA5] group-hover:text-[#6D4AFF]'
                    )}
                  />
                  <AnimatePresence>
                    {sidebarOpen && (
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
                        layoutId="activePill"
                        className="absolute inset-0 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] shadow-glow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                      <motion.div
                        layoutId="activeLine"
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
        <div className="border-t border-[#E9E2FF] pt-3 space-y-1.5">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => clsx(
                'relative group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 min-h-[46px] overflow-hidden',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-[#6B5CA5] hover:bg-[#F3F0FF] hover:text-[#6D4AFF]'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 z-10 transition-all duration-300',
                      isActive ? 'text-white' : 'text-[#6B5CA5] group-hover:text-[#6D4AFF]'
                    )}
                  />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-semibold z-10 truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <>
                      <motion.div layoutId="activePillBottom" className="absolute inset-0 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] shadow-glow-sm" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                      <motion.div layoutId="activeLineBottom" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md z-20" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card */}
        <div className={clsx('p-2.5 rounded-2xl border border-[#E9E2FF] bg-[#F8F5FF] flex items-center gap-2.5 transition-all duration-300', !sidebarOpen && 'justify-center')}>
          <Avatar src={user?.photo} name={user?.fullName} size="sm" className="ring-2 ring-[#EDE8FF] flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-[#1E1B4B] text-xs font-bold truncate leading-none">{user?.fullName}</p>
                <p className="text-[#6B5CA5] text-[10px] truncate mt-1">@{user?.username}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="btn-icon w-8 h-8 hover:bg-[#FEE2E2] hover:text-red-600 text-[#6B5CA5] flex-shrink-0"
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
    <motion.aside
      className="hidden lg:flex flex-col h-screen p-4 flex-shrink-0 z-30 bg-white border-r border-[#E9E2FF] shadow-sm"
      animate={{ width: sidebarOpen ? 260 : 80 }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
    >
      <SidebarContent />
    </motion.aside>
  );
}
