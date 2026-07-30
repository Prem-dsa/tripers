import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plane, Receipt, Wallet, Plus, ArrowRight, TrendingUp, MapPin,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Train, Ticket,
  Stethoscope, Package, BarChart3, Users, Clock,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { StatCard, Avatar, GlassCard, Badge, EmptyState } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const categoryIcons = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package,
};

const categoryColors = [
  '#818CF8','#C084FC','#F472B6','#34D399','#F87171',
  '#FBBF24','#38BDF8','#A78BFA','#2DD4BF','#94A3B8',
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94A3B8',
        font: { size: 11, weight: '600', family: 'Inter, sans-serif' },
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#FFFFFF',
      bodyColor: '#CBD5E1',
      bodyFont: { size: 12, family: 'Inter, sans-serif', weight: '500' },
      titleFont: { size: 13, weight: 'bold', family: 'Inter, sans-serif' },
      padding: 14,
      cornerRadius: 14,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    },
  },
};

const barOptions = {
  ...chartOptions,
  scales: {
    x: {
      ticks: { color: '#64748B', font: { size: 10, weight: '600', family: 'Inter, sans-serif' } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      ticks: {
        color: '#64748B',
        font: { size: 10, weight: '600', family: 'Inter, sans-serif' },
        callback: (v) => `₹${v}`,
        maxTicksLimit: 4,
      },
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      border: { display: false },
    },
  },
};

function SkeletonCard({ className = '' }) {
  return <div className={`skeleton rounded-[24px] ${className}`} />;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const stats = data?.stats;
  const charts = data?.charts;
  const recentTrips = data?.recentTrips || [];

  const categoryLabels = charts ? Object.keys(charts.categoryData || {}) : [];
  const categoryValues = charts ? Object.values(charts.categoryData || {}) : [];
  const monthLabels = charts ? Object.keys(charts.monthlyData || {}).slice(-6) : [];
  const monthValues = charts ? Object.values(charts.monthlyData || {}).slice(-6) : [];

  const doughnutData = {
    labels: categoryLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: categoryValues, backgroundColor: categoryColors, borderWidth: 0, hoverOffset: 6 }],
  };

  const barData = {
    labels: monthLabels,
    datasets: [{
      label: 'Spending (₹)',
      data: monthValues,
      backgroundColor: 'rgba(129, 140, 248, 0.8)',
      borderColor: '#818CF8',
      borderWidth: 0,
      borderRadius: 10,
      borderSkipped: false,
    }],
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <SkeletonCard className="h-32 sm:h-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} className="h-28 sm:h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} className="h-64 sm:h-80" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 pb-4"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Welcome Banner ────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-5 sm:p-8 lg:p-10 bg-white/10 backdrop-blur-[32px] border border-white/20 shadow-2xl text-white">
          {/* Ambient glows */}
          <div className="absolute -top-16 -right-16 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-pink-500/15 rounded-full blur-[60px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.photo}
                name={user?.fullName}
                size="lg"
                className="ring-4 ring-white/25 shadow-2xl rounded-full flex-shrink-0"
              />
              <div>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Welcome back 👋</p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none">
                  {user?.fullName}
                </h1>
                <p className="text-purple-300/80 text-[11px] font-bold uppercase tracking-widest mt-1.5">
                  @{user?.username}
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                to="/trips/new"
                className="flex-1 sm:flex-none btn-primary rounded-full px-5 sm:px-7 py-3 sm:py-3.5 shadow-glow text-sm justify-center"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span className="font-bold">New Trip</span>
              </Link>
              <Link
                to="/trips"
                className="flex-1 sm:flex-none btn-secondary rounded-full px-5 sm:px-7 py-3 sm:py-3.5 text-sm justify-center"
              >
                <Plane size={16} className="stroke-2" />
                <span className="font-bold">My Trips</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Stats Grid ─────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={fadeUp}
      >
        <StatCard
          icon={<Plane size={18} className="text-white stroke-[2.5]" />}
          label="Total Trips"
          value={(stats?.tripsCreated || 0) + (stats?.tripsJoined || 0)}
          gradient="from-indigo-500 to-purple-500"
        />
        <StatCard
          icon={<Wallet size={18} className="text-white stroke-[2.5]" />}
          label="Total Spent"
          value={`₹${formatCurrency(stats?.totalPaid || 0)}`}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={<Receipt size={18} className="text-white stroke-[2.5]" />}
          label="Pending"
          value={stats?.pendingSettlements ?? '0'}
          gradient="from-rose-500 to-red-500"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-white stroke-[2.5]" />}
          label="Saved"
          value={`₹${formatCurrency(Math.round((stats?.totalPaid || 0) * 0.12))}`}
          sub="~12% savings"
          gradient="from-emerald-400 to-teal-500"
        />
      </motion.div>

      {/* ── Charts & Trips Grid ────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={fadeUp}
      >
        {/* Recent Trips */}
        <GlassCard className="md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em]">Recent Trips</h2>
            <Link to="/trips" className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-white flex items-center gap-1 transition-colors">
              All <ArrowRight size={12} className="stroke-[2.5]" />
            </Link>
          </div>
          {!recentTrips.length ? (
            <EmptyState
              icon={<MapPin size={28} className="text-indigo-400" />}
              title="No trips yet"
              description="Create your first trip to start tracking."
              action={
                <Link to="/trips/new" className="btn-primary text-xs py-2.5 px-5 rounded-full shadow-glow">
                  Create Trip
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recentTrips.slice(0, 5).map((trip) => (
                <Link
                  key={trip._id}
                  to={`/trips/${trip._id}`}
                  className="flex items-center gap-3 p-3 rounded-[18px] bg-white/8 border border-white/15 hover:bg-white/15 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-[12px] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center">
                    {trip.coverImage ? (
                      <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                    ) : (
                      <Plane size={16} className="text-white stroke-[2.5]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[13px] truncate group-hover:text-indigo-300 transition-colors">
                      {trip.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-slate-400 text-[10px] font-bold uppercase tracking-wide truncate">
                      <MapPin size={10} className="stroke-[2.5] flex-shrink-0" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                  </div>
                  <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'gray' : 'primary'} className="text-[9px] flex-shrink-0">
                    {trip.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Category Doughnut */}
        <GlassCard className="md:col-span-1">
          <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Category Breakdown</h2>
          {!categoryValues.length ? (
            <EmptyState
              icon={<BarChart3 size={28} className="text-indigo-400" />}
              title="No expense data"
              description="Add expenses to see category breakdown."
            />
          ) : (
            <div className="flex items-center justify-center h-[220px] sm:h-[240px]">
              <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '72%' }} />
            </div>
          )}
        </GlassCard>

        {/* Monthly Bar Chart */}
        <GlassCard className="md:col-span-2 lg:col-span-1">
          <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Monthly Spending</h2>
          {!monthValues.length ? (
            <EmptyState
              icon={<TrendingUp size={28} className="text-indigo-400" />}
              title="No monthly data"
              description="Add expenses to see monthly trends."
            />
          ) : (
            <div className="h-[220px] sm:h-[240px] w-full">
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ── Activity & Settlements ──────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={fadeUp}
      >
        {/* Recent Expense Feed */}
        <GlassCard>
          <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Recent Expenses</h2>
          {!data?.recentExpenses?.length ? (
            <EmptyState
              icon={<Receipt size={28} className="text-indigo-400" />}
              title="No expenses yet"
              description="Expenses will show here as you add them."
            />
          ) : (
            <div className="space-y-2.5">
              {data.recentExpenses.map((expense) => {
                const IconComp = categoryIcons[expense.category] || Package;
                return (
                  <div
                    key={expense._id}
                    className="flex items-center gap-3 p-3 sm:p-3.5 rounded-[18px] bg-white/8 border border-white/15 hover:bg-white/12 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                      <IconComp size={16} className="text-indigo-300 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-[13px] truncate">{expense.name}</p>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mt-0.5 truncate">
                        {expense.trip?.name} • {expense.paidBy?.fullName}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-extrabold text-[13px]">₹{formatCurrency(expense.amount)}</p>
                      <Badge variant="primary" className="mt-0.5 text-[9px]">{expense.splitType}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Settlement Reminders */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em]">Settlements</h2>
            <Link to="/settlements" className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-white flex items-center gap-1 transition-colors">
              View All <ArrowRight size={12} className="stroke-[2.5]" />
            </Link>
          </div>
          {!data?.pendingSettlements?.length ? (
            <EmptyState
              icon={<Wallet size={28} className="text-indigo-400" />}
              title="All settled up! 🎉"
              description="No outstanding payment settlements."
            />
          ) : (
            <div className="space-y-2.5">
              {data.pendingSettlements.map((settlement) => (
                <div
                  key={settlement._id}
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-[18px] bg-white/8 border border-white/15 hover:bg-white/12 transition-all duration-200"
                >
                  <Avatar src={settlement.from?.photo} name={settlement.from?.fullName} size="sm" className="ring-2 ring-white/20 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-bold truncate">
                      <span className="text-rose-400">{settlement.from?.fullName?.split(' ')[0]}</span>
                      <span className="text-slate-400 font-medium mx-1">→</span>
                      <span className="text-emerald-400">{settlement.to?.fullName?.split(' ')[0]}</span>
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">
                      {settlement.trip?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-extrabold text-[13px]">₹{formatCurrency(settlement.amount)}</p>
                    <Badge
                      variant={settlement.status === 'requested' ? 'warning' : 'gray'}
                      className="mt-0.5 text-[9px]"
                    >
                      {settlement.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}