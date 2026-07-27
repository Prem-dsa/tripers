import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/AppLayout';
import { MapPin } from 'lucide-react';

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// App Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TripsPage = lazy(() => import('./pages/trips/TripsPage'));
const TripDetailPage = lazy(() => import('./pages/trips/TripDetailPage'));
const CreateTripPage = lazy(() => import('./pages/trips/CreateTripPage'));
const EditTripPage = lazy(() => import('./pages/trips/EditTripPage'));
const JoinTripPage = lazy(() => import('./pages/trips/JoinTripPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const JoinTripManualPage = lazy(() => import('./pages/JoinTripManualPage'));
const MemberProfilePage = lazy(() => import('./pages/MemberProfilePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Content...</p>
      </div>
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
              <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4 px-4">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 rounded-3xl flex items-center justify-center border border-white/5">
                  <MapPin size={40} className="text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
                <p className="text-slate-400 text-sm text-center max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
                <a href="/dashboard" className="btn-primary btn mt-2 px-6 py-3 rounded-xl">Go to Dashboard</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
