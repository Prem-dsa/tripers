import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Building, Phone, CreditCard, Mail,
  TrendingUp, TrendingDown, Receipt, Users,
  Plane, Wallet, ArrowUpFromLine, UserX, BarChart3,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Train, Ticket, Stethoscope, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { userApi } from '../api';
import { GlassCard, StatCard, Avatar, EmptyState, Spinner, Badge } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import { useAuthStore } from '../store/authStore';

ChartJS.register(ArcElement, Tooltip, Legend);

const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package
};
const CAT_COLORS = ['#6c63ff', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#94a3b8'];

export default function MemberProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = id === currentUser?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['member-profile', id],
    queryFn: () => userApi.getProfile(id).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex-center min-h-96">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-dark-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <GlassCard>
        <EmptyState
          icon={<UserX size={32} className="text-dark-600" />}
          title="User not found"
          description="This profile doesn't exist or isn't accessible"
          action={<Link to="/trips" className="btn-primary btn">Back to Trips</Link>}
        />
      </GlassCard>
    );
  }

  const { user, stats, trips, recentExpenses } = data;

  // Category breakdown for doughnut
  const catBreakdown = {};
  (recentExpenses || []).forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + e.amount;
  });
  const catLabels = Object.keys(catBreakdown);
  const catValues = Object.values(catBreakdown);

  const doughnutData = {
    labels: catLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      data: catValues,
      backgroundColor: CAT_COLORS.slice(0, catLabels.length),
      borderWidth: 0,
      hoverBorderWidth: 2,
      hoverBorderColor: '#fff',
    }],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/trips" className="flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Profile Header */}
      <motion.div
        className="glass p-6 border-primary-400/15 relative overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, transparent 60%)' }}
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center relative">
          <Avatar src={user.photo} name={user.fullName} size="2xl" className="ring-4 ring-primary-400/30 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
                <p className="text-primary-400 text-sm font-medium">@{user.username}</p>
                {user.bio && <p className="text-dark-300 text-sm mt-2 max-w-md">{user.bio}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-dark-400 text-xs">
                  {user.city && <span className="flex items-center gap-1"><MapPin size={11} /> {user.city}</span>}
                  {user.company && <span className="flex items-center gap-1"><Building size={11} /> {user.company}</span>}
                  {user.phone && <span className="flex items-center gap-1"><Phone size={11} /> {user.phone}</span>}
                  {user.upiId && <span className="flex items-center gap-1"><CreditCard size={11} /> {user.upiId}</span>}
                </div>
              </div>
              {isOwnProfile && (
                <Link to="/profile" className="btn-outline btn text-sm">Edit Profile</Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Plane size={16} className="text-white" />} label="Trips Joined" value={(stats?.tripsCreated || 0) + (stats?.tripsJoined || 0)} gradient="from-primary-400 to-purple-500" />
        <StatCard icon={<Wallet size={16} className="text-white" />} label="Total Paid" value={stats ? `₹${formatCurrency(stats.totalPaid)}` : '—'} gradient="from-green-400 to-emerald-600" />
        <StatCard icon={<ArrowUpFromLine size={16} className="text-white" />} label="To Receive" value={stats ? `₹${formatCurrency(stats.totalToReceive)}` : '—'} gradient="from-amber-400 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared Trips */}
        <GlassCard>
          <h2 className="section-title">Shared Trips</h2>
          {!trips?.length ? (
            <EmptyState icon={<Plane size={32} className="text-dark-600" />} title="No shared trips" description="You haven't traveled together yet" />
          ) : (
            <div className="space-y-2">
              {trips.map(trip => (
                <Link
                  key={trip._id}
                  to={`/trips/${trip._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400/20 to-purple-500/20 flex-shrink-0">
                    {trip.coverImage
                      ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex-center"><Plane size={16} className="text-primary-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-100 font-semibold text-sm truncate group-hover:text-primary-400 transition-colors">{trip.name}</p>
                    <p className="text-dark-400 text-xs flex items-center gap-1"><MapPin size={10} /> {trip.destination}</p>
                  </div>
                  <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'gray' : 'primary'}>
                    {trip.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Spending Chart */}
        <GlassCard>
          <h2 className="section-title">Spending by Category</h2>
          {catLabels.length ? (
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } },
                  tooltip: {
                    backgroundColor: '#12121a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    callbacks: { label: ctx => ` ₹${formatCurrency(ctx.raw)}` },
                  },
                },
              }}
            />
          ) : (
            <EmptyState icon={<BarChart3 size={32} className="text-dark-600" />} title="No expense data" />
          )}
        </GlassCard>
      </div>

      {/* Recent Expenses */}
      {recentExpenses?.length > 0 && (
        <GlassCard>
          <h2 className="section-title">Recent Expenses Paid</h2>
          <div className="space-y-2">
            {recentExpenses.slice(0, 8).map(exp => (
              <div key={exp._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-9 h-9 rounded-xl bg-dark-600 flex-center flex-shrink-0">
                  {(() => {
                    const CatIcon = CAT_ICONS[exp.category] || Package;
                    return <CatIcon size={14} className="text-white" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dark-100 font-medium text-sm truncate">{exp.name}</p>
                  <p className="text-dark-400 text-xs">
                    {exp.trip?.name} · {format(new Date(exp.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="text-white font-bold text-sm flex-shrink-0">₹{formatCurrency(exp.amount)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
