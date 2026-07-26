import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plane, Plus, Wallet, User } from 'lucide-react';
import { clsx } from 'clsx';

const bottomNavItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/trips',       icon: Plane,           label: 'Trips' },
  { isAction: true }, // Placeholder for Center Quick Add
  { to: '/settlements', icon: Wallet,          label: 'Settlements' },
  { to: '/profile',     icon: User,            label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/85 backdrop-blur-md border-t border-[#E9E2FF] px-4 pb-safe flex items-center justify-around h-16 shadow-[0_-4px_24px_rgba(109,74,255,0.06)]">
      {bottomNavItems.map((item, idx) => {
        if (item.isAction) {
          return (
            <NavLink
              key="quick-add"
              to="/trips/new"
              className="relative -translate-y-4 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] text-white flex items-center justify-center shadow-glow-sm ring-4 ring-[#F8F5FF] transition-all duration-300 active:scale-95">
                <Plus size={22} className="stroke-[2.5]" />
              </div>
            </NavLink>
          );
        }

        const isActive = location.pathname === item.to || 
          (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 relative group"
          >
            <item.icon
              size={18}
              className={clsx(
                'transition-all duration-300 z-10',
                isActive 
                  ? 'text-[#6D4AFF] scale-110 stroke-[2.2]' 
                  : 'text-[#6B5CA5] group-hover:text-[#6D4AFF]'
              )}
            />
            <span
              className={clsx(
                'text-[9px] font-bold tracking-wide mt-1 z-10 transition-colors duration-300',
                isActive 
                  ? 'text-[#6D4AFF]' 
                  : 'text-[#6B5CA5] group-hover:text-[#6D4AFF]'
              )}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottomActiveDot"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6D4AFF]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
