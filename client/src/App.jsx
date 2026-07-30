import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/AppLayout';
import { MapPin, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex items-center justify-center min-h-[450px] w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-glow animate-pulse">
          <Compass size={24} className="text-white" />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Loading...</p>
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
              <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <motion.div
                  className="w-full max-w-md glass p-10 text-center relative z-10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <MapPin size={28} className="text-white stroke-[2.5]" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Page Not Found</h1>
                  <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">The page you're looking for doesn't exist.</p>
                  <Link to="/dashboard" className="btn-primary inline-flex items-center justify-center py-3.5 px-8 rounded-full shadow-glow text-[12px] font-bold uppercase tracking-widest">
                    Return to Dashboard
                  </Link>
                </motion.div>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
