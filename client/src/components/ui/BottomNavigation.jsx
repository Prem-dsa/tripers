import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Home, Plane, Receipt, User, Plus } from 'lucide-react';
import { QuickActionsModal } from './QuickActionsModal';

const mobileItems = [
  { to: '/dashboard', icon: Home,    label: 'Home' },
  { to: '/trips',     icon: Plane,   label: 'Trips' },
  { to: '/quick',     icon: Plus,    label: 'Action', isCenter: true },
  { to: '/expenses',  icon: Receipt, label: 'Expenses' },
  { to: '/profile',   icon: User,    label: 'Profile' },
];

export function BottomNavigation() {
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          pointerEvents: 'none',
        }}
      >
        <div
          className="lg:hidden mx-3 mb-3 max-w-lg sm:mx-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <div
            style={{
              background: 'rgba(10, 15, 30, 0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 8px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {mobileItems.map((item) => {
              if (item.isCenter) {
                return (
                  <div key="center-fab" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <motion.button
                      onClick={() => setQuickModalOpen(true)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      aria-label="Quick Actions"
                      style={{
                        width: 54,
                        height: 54,
                        background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 0 24px rgba(99,102,241,0.6)',
                        marginTop: -22,
                        flexShrink: 0,
                        border: '2px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      <item.icon size={26} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                >
                  {({ isActive }) => (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 6px',
                        borderRadius: 16,
                        minWidth: 50,
                        transition: 'all 0.2s ease',
                        color: isActive ? '#818cf8' : '#64748b',
                        position: 'relative',
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 16,
                            background: 'rgba(99,102,241,0.2)',
                            border: '1px solid rgba(99,102,241,0.4)',
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <item.icon
                        size={21}
                        strokeWidth={isActive ? 2.5 : 2}
                        style={{ position: 'relative', zIndex: 1 }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          marginTop: 3,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Quick Actions Sheet Modal */}
      <QuickActionsModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
      />
    </>
  );
}
