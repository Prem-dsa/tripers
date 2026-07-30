import { Outlet } from 'react-router-dom';
import { Sidebar } from './ui/Sidebar';
import { Navbar } from './ui/Navbar';
import { BottomNavigation } from './ui/BottomNavigation';
import { MobileDrawer } from './ui/MobileDrawer';
import { AmbientBackground } from './three/AmbientBackground';
import { NotificationPanel } from './notifications/NotificationPanel';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/uiStore';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { notificationApi } from '../api';

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    connectSocket();
    notificationApi.getAll({ limit: 1 })
      .then(res => setUnreadCount(res.data?.unreadCount || 0))
      .catch(() => {});
    return () => { disconnectSocket(); };
  }, [isAuthenticated]);

  return (
    <>
      {/* Root Layout */}
      <div
        className="flex bg-slate-950 text-slate-100"
        style={{ height: '100svh' }}
      >
        {/* Three.js Ambient Background */}
        <AmbientBackground />

        {/* Floating Sidebar (Desktop: >1024px, Tablet: 768-1023px mini) */}
        <Sidebar />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10" style={{ minWidth: 0 }}>
          {/* Sticky Top Navbar */}
          <Navbar />

          {/* Scrollable Page Content */}
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
            }}
          >
            <div className="p-3 sm:p-4 lg:p-6 lg:pb-6 max-w-[1400px] mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Slide Drawer (Triggered by Hamburger) */}
      <MobileDrawer />

      {/* Mobile Bottom Navigation with Center FAB (+) Action Sheet */}
      <BottomNavigation />

      {/* Overlays */}
      <NotificationPanel />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(30px)',
            color: '#F1F5F9',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '18px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            fontFamily: '"SF Pro Display", Inter, sans-serif',
            padding: '12px 20px',
            maxWidth: '380px',
          },
          success: { iconTheme: { primary: '#34D399', secondary: '#0f172a' } },
          error:   { iconTheme: { primary: '#F87171', secondary: '#0f172a' } },
        }}
      />
    </>
  );
}
