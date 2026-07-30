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
const CAT_COLORS = ['#7C5CFC', '#F97316', '#22C55E', '#3B82F6', '#A855F7', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#94A3B8'];

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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <GlassCard className="bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px]">
        <EmptyState
          icon={<UserX size={32} className="text-slate-400" />}
          title="User not found"
          description="This profile doesn't exist or isn't accessible"
          action={<Link to="/trips" className="btn-primary rounded-full py-3 px-6 font-bold tracking-wide shadow-glow text-[12px]">Back to Trips</Link>}
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
      hoverBorderWidth: 3,
      hoverBorderColor: '#fff',
      spacing: 2,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#64748B', font: { size: 11, family: 'Inter', weight: '600' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        titleColor: '#1E293B',
        bodyColor: '#64748B',
        padding: 14,
        cornerRadius: 16,
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-2 sm:px-4">
      <Link to="/trips" className="flex items-center gap-2 text-slate-500 hover:text-primary-500 text-[12px] font-bold transition-colors uppercase tracking-wider">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Profile Header */}
      <motion.div
        className="bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[32px] p-6 sm:p-10 relative overflow-hidden shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-primary-100 rounded-full blur-[80px] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-secondary-100 rounded-full blur-[60px] opacity-30 pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
          <Avatar src={user.photo} name={user.fullName} size="2xl" className="ring-4 ring-white/80 shadow-float flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{user.fullName}</h1>
                <p className="text-primary-500 text-[12px] font-bold uppercase tracking-widest mt-2">@{user.username}</p>
                {user.bio && <p className="text-slate-500 text-sm mt-3 max-w-md leading-relaxed font-medium">{user.bio}</p>}
                <div className="flex flex-wrap gap-3 mt-4 text-slate-500 text-[11px] font-medium">
                  {user.city && <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"><MapPin size={11} className="text-primary-500" /> {user.city}</span>}
                  {user.company && <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"><Building size={11} className="text-primary-500" /> {user.company}</span>}
                  {user.phone && <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"><Phone size={11} className="text-primary-500" /> {user.phone}</span>}
                  {user.upiId && <span className="flex items-center gap-1.5 bg-success/5 px-3 py-1.5 rounded-full border border-success/20"><CreditCard size={11} className="text-success" /> {user.upiId}</span>}
                </div>
              </div>
              {isOwnProfile && (
                <Link to="/profile" className="flex items-center gap-2 text-[11px] font-bold px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 shadow-sm uppercase tracking-wider transition-all">
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Plane size={16} className="text-white" />} label="Trips Joined" value={(stats?.tripsCreated || 0) + (stats?.tripsJoined || 0)} gradient="from-primary-500 to-purple-500" />
        <StatCard icon={<Wallet size={16} className="text-white" />} label="Total Paid" value={stats ? `₹${formatCurrency(stats.totalPaid)}` : '—'} gradient="from-emerald-500 to-green-600" />
        <StatCard icon={<ArrowUpFromLine size={16} className="text-white" />} label="To Receive" value={stats ? `₹${formatCurrency(stats.totalToReceive)}` : '—'} gradient="from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <GlassCard className="!p-8 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6 relative z-10">Spending by Category</h3>
          {catValues.length ? (
            <div className="h-56 relative z-10">
              <Doughnut data={doughnutData} options={chartOpts} />
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={28} className="text-primary-500" />} title="No data yet" />
          )}
        </GlassCard>

        {/* Recent Expenses */}
        <GlassCard className="!p-8 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-100 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6 relative z-10">Recent Expenses</h3>
          {recentExpenses?.length ? (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 no-scrollbar relative z-10">
              {recentExpenses.slice(0, 8).map((exp, i) => {
                const CatIcon = CAT_ICONS[exp.category] || Package;
                return (
                  <motion.div
                    key={exp._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3.5 bg-white/60 border border-white/80 rounded-[18px] shadow-sm hover:shadow-float hover:bg-white transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-[14px] bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <CatIcon size={15} className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-bold text-[12px] truncate">{exp.name}</p>
                      <p className="text-slate-500 text-[10px] mt-1 font-medium">{format(new Date(exp.date), 'MMM d, yyyy')}</p>
                    </div>
                    <p className="text-slate-800 font-bold text-[12px] flex-shrink-0">₹{formatCurrency(exp.amount)}</p>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Receipt size={28} className="text-primary-500" />} title="No expenses yet" />
          )}
        </GlassCard>
      </div>

      {/* Trips List */}
      {trips?.length > 0 && (
        <GlassCard className="!p-8 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px]">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Shared Trips</h3>
          <div className="space-y-3">
            {trips.map((trip, i) => (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/trips/${trip._id}`}
                  className="flex items-center gap-4 p-4 bg-white/60 border border-white/80 rounded-[20px] shadow-sm hover:shadow-float hover:bg-white transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-[14px] overflow-hidden bg-gradient-to-br from-primary-100 to-purple-100 border border-white/80 flex items-center justify-center shadow-sm flex-shrink-0">
                    {trip.coverImage
                      ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                      : <Plane size={18} className="text-primary-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-[13px] truncate group-hover:text-primary-500 transition-colors">{trip.name}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1 font-medium">
                      <MapPin size={10} className="text-primary-500" />
                      <span className="truncate">{trip.destination}</span>
                      <span>•</span>
                      <Users size={10} className="text-primary-500" />
                      <span>{trip.members?.length}</span>
                    </div>
                  </div>
                  <Badge variant={trip.status === 'completed' ? 'gray' : 'success'} className="flex-shrink-0">{trip.status}</Badge>
                </Link>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
