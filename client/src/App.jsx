import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/AppLayout';
import { MapPin } from 'lucide-react';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// App Pages
import DashboardPage from './pages/DashboardPage';
import TripsPage from './pages/trips/TripsPage';
import TripDetailPage from './pages/trips/TripDetailPage';
import CreateTripPage from './pages/trips/CreateTripPage';
import EditTripPage from './pages/trips/EditTripPage';
import JoinTripPage from './pages/trips/JoinTripPage';
import ProfilePage from './pages/ProfilePage';
import SettlementsPage from './pages/SettlementsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExpensesPage from './pages/ExpensesPage';
import ExplorePage from './pages/ExplorePage';
import JoinTripManualPage from './pages/JoinTripManualPage';
import MemberProfilePage from './pages/MemberProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/join/:inviteCode" element={<JoinTripPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/new" element={<CreateTripPage />} />
            <Route path="/trips/:tripId" element={<TripDetailPage />} />
            <Route path="/trips/:tripId/edit" element={<EditTripPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/join" element={<JoinTripManualPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Settings alias → Profile */}
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
            <Route path="/members/:id" element={<MemberProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4 px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-purple-500/10 rounded-3xl flex items-center justify-center border border-white/5">
                <MapPin size={40} className="text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
              <p className="text-gray-400 text-sm text-center max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
              <a href="/dashboard" className="btn-primary btn mt-2 px-6 py-3 rounded-xl">Go to Dashboard</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
