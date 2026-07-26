import { Outlet } from 'react-router-dom';
import { Sidebar } from './ui/Sidebar';
import { Navbar } from './ui/Navbar';
import { BottomNav } from './ui/BottomNav';
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
    <div className="flex h-dvh overflow-hidden bg-[#F8F5FF]">
      <AmbientBackground />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 pb-20 sm:pb-24 lg:pb-6 min-h-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />


      {/* Overlays */}
      <NotificationPanel />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1E1B4B',
            border: '1px solid #E9E2FF',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 12px 40px rgba(109,74,255,0.12)',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#6D4AFF', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

