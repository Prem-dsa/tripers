import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plane,
  Receipt,
  Wallet,
  Plus,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Compass,
  ArrowRight,
  TrendingUp,
  MapPin,
  Users,
  Hotel,
  UtensilsCrossed,
  Fuel,
  ShoppingBag,
  Car,
  Train,
  Ticket,
  Stethoscope,
  Package,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

import { userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import {
  StatCard,
  Avatar,
  GlassCard,
  Badge,
  EmptyState,
} from '../components/ui/index';
import { formatCurrency } from '../utils/currency';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const categoryIcons = {
  hotel: Hotel,
  food: UtensilsCrossed,
  fuel: Fuel,
  shopping: ShoppingBag,
  taxi: Car,
  flights: Plane,
  train: Train,
  entertainment: Ticket,
  medical: Stethoscope,
  other: Package,
};

const categoryColors = [
  '#6D4AFF', // Primary Purple
  '#8B5CF6', // Secondary Purple
  '#A855F7', // Accent
  '#C084FC', // Light Accent
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const stats = data?.stats;
  const charts = data?.charts;

  const categoryLabels = charts ? Object.keys(charts.categoryData || {}) : [];
  const categoryValues = charts ? Object.values(charts.categoryData || {}) : [];
  const monthLabels = charts ? Object.keys(charts.monthlyData || {}).slice(-6) : [];
  const monthValues = charts ? Object.values(charts.monthlyData || {}).slice(-6) : [];

  const doughnutData = {
    labels: categoryLabels.map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [
      {
        data: categoryValues,
        backgroundColor: categoryColors,
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
      },
    ],
  };

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Spending (₹)',
        data: monthValues,
        backgroundColor: 'rgba(109, 74, 255, 0.85)',
        borderColor: '#6D4AFF',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6B5CA5',
          font: {
            size: 10,
            weight: 'bold',
            family: 'Inter'
          },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#E9E2FF',
        borderWidth: 1,
        titleColor: '#1E1B4B',
        bodyColor: '#6B5CA5',
        bodyFont: {
          size: 11,
          family: 'Inter'
        },
        titleFont: {
          size: 11,
          weight: 'bold',
          family: 'Inter'
        },
        padding: 10,
        cornerRadius: 12,
        boxShadow: '0 8px 32px rgba(109,74,255,0.06)'
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: {
          color: '#6B5CA5',
          font: { size: 9, weight: 'bold', family: 'Inter' }
        },
        grid: {
          color: 'rgba(109, 74, 255, 0.04)',
        },
      },
      y: {
        ticks: {
          color: '#6B5CA5',
          font: { size: 9, weight: 'bold', family: 'Inter' },
          callback: (value) => `₹${value}`,
        },
        grid: {
          color: 'rgba(109, 74, 255, 0.04)',
        },
      },
    },
  };

  const renderSkeletons = () => (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="skeleton h-44 rounded-[24px]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-32 rounded-[24px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="skeleton h-80 rounded-[24px]" />
        <div className="skeleton h-80 rounded-[24px]" />
        <div className="skeleton h-80 rounded-[24px]" />
      </div>
    </div>
  );

  if (isLoading) return renderSkeletons();

  const recentTrips = data?.recentTrips || [];

  return (
    <motion.div
      className="space-y-8 max-w-7xl mx-auto pb-12 px-2 sm:px-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <div className="relative rounded-[24px] overflow-hidden p-6 sm:p-8 bg-white border border-[#E9E2FF] shadow-card">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#6D4AFF]/5 to-[#8B5CF6]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#A855F7]/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.photo}
                name={user?.fullName}
                size="xl"
                className="ring-4 ring-[#EDE8FF] shadow-md rounded-full"
              />
              <div>
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-widest">Welcome back</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight mt-1 leading-tight">
                  {user?.fullName}
                </h1>
                <p className="text-[#6D4AFF] text-xs mt-1.5 font-bold uppercase tracking-wider">@{user?.username}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/trips/new"
                className="btn-primary btn text-[10px] tracking-wider font-bold uppercase px-5 py-3 rounded-xl shadow-glow-sm"
              >
                <Plus size={13} className="stroke-[2.5]" />
                New Trip
              </Link>
              <Link
                to="/trips"
                className="btn-secondary btn text-[10px] tracking-wider font-bold uppercase px-5 py-3 rounded-xl"
              >
                <Plane size={13} />
                My Trips
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <StatCard
          icon={<Plane size={16} className="text-white" />}
          label="Total Trips"
          value={(stats?.tripsCreated || 0) + (stats?.tripsJoined || 0)}
          gradient="from-[#6D4AFF] to-[#8B5CF6]"
        />
        <StatCard
          icon={<Wallet size={16} className="text-white" />}
          label="Total Expenses"
          value={`₹${formatCurrency(stats?.totalPaid || 0)}`}
          gradient="from-[#8B5CF6] to-[#A855F7]"
        />
        <StatCard
          icon={<Receipt size={16} className="text-white" />}
          label="Pending Settlements"
          value={stats?.pendingSettlements ?? '0'}
          gradient="from-rose-500 to-pink-500"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-white" />}
          label="Money Saved"
          value={`₹${formatCurrency(Math.round((stats?.totalPaid || 0) * 0.12))}`}
          sub="Estimated 12% savings"
          gradient="from-amber-500 to-orange-500"
        />
      </motion.div>

      {/* Dashboard Widgets grid */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        variants={itemVariants}
      >
        {/* Recent & Upcoming Trips */}
        <GlassCard className="xl:col-span-1 flex flex-col justify-between bg-white border-[#E9E2FF] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D4AFF]/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest">Active & Upcoming</h2>
              <Link to="/trips" className="text-[#6D4AFF] text-[10px] font-bold uppercase tracking-wider hover:text-[#5A38E8] flex items-center gap-1">
                All Folders <ArrowRight size={11} className="stroke-[2.5]" />
              </Link>
            </div>

            {!recentTrips.length ? (
              <EmptyState
                icon={<MapPin size={32} className="text-[#6D4AFF]" />}
                title="No travel folders"
                description="Initialize your first trip to log expenses and splits."
                action={
                  <Link to="/trips/new" className="btn-primary btn text-xs uppercase font-bold tracking-wider py-2 px-4 rounded-xl shadow-glow-sm">
                    Create Folder
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3.5">
                {recentTrips.slice(0, 4).map((trip) => (
                  <Link
                    key={trip._id}
                    to={`/trips/${trip._id}`}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F8F5FF] border border-transparent hover:border-[#E9E2FF] transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex-shrink-0 border border-white/10 flex-center text-white shadow-sm">
                      {trip.coverImage ? (
                        <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                      ) : (
                        <Plane size={16} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1E1B4B] font-bold text-xs truncate group-hover:text-[#6D4AFF] transition-colors">
                        {trip.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[#6B5CA5] text-[9px] font-semibold uppercase tracking-wider truncate">
                        <MapPin size={9} />
                        <span>{trip.destination}</span>
                      </div>
                    </div>
                    <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'gray' : 'primary'}>
                      {trip.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Charts & Category Pie Chart */}
        <GlassCard className="xl:col-span-1 bg-white border-[#E9E2FF] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-6">Category Spending</h2>
          {!categoryValues.length ? (
            <EmptyState icon={<BarChart3 size={28} className="text-[#6D4AFF]" />} title="No expense data" description="Add expenses to construct category metrics." />
          ) : (
            <div className="flex-center h-60">
              <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '75%' }} />
            </div>
          )}
        </GlassCard>

        {/* Monthly Expense Chart */}
        <GlassCard className="xl:col-span-1 bg-white border-[#E9E2FF] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-6">Monthly Expenses</h2>
          {!monthValues.length ? (
            <EmptyState icon={<TrendingUp size={28} className="text-[#6D4AFF]" />} title="No monthly metrics" description="Add expense entries to view charts." />
          ) : (
            <div className="h-60 flex items-end">
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Travel Activity and Settlements */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        {/* Recent Expense Activity */}
        <GlassCard className="bg-white border-[#E9E2FF] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D4AFF]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-6">Expense Activity Feed</h2>
          {!data?.recentExpenses?.length ? (
            <EmptyState icon={<Receipt size={28} className="text-[#6D4AFF]" />} title="Feed is empty" description="Expenses will populate here as trips proceed." />
          ) : (
            <div className="space-y-3.5">
              {data.recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#E9E2FF] bg-[#F8F5FF]/50 hover:bg-[#F8F5FF] hover:border-[#D0C6FF] transition-all duration-350"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] border border-[#E9E2FF] flex-center flex-shrink-0 shadow-inner">
                    {(() => {
                      const IconComp = categoryIcons[expense.category] || Package;
                      return <IconComp size={14} className="text-[#6D4AFF]" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1E1B4B] font-bold text-xs truncate">{expense.name}</p>
                    <p className="text-[#6B5CA5] text-[9px] font-bold uppercase tracking-wider mt-1.5 truncate">
                      {expense.trip?.name} • Paid by {expense.paidBy?.fullName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#1E1B4B] font-extrabold text-xs">₹{formatCurrency(expense.amount)}</p>
                    <Badge variant="primary" className="mt-1.5 text-[8px]">{expense.splitType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Pending Settlement Requests */}
        <GlassCard className="bg-white border-[#E9E2FF] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-6">Settlement Reminders</h2>
          {!data?.pendingSettlements?.length ? (
            <EmptyState icon={<Wallet size={28} className="text-[#6D4AFF]" />} title="Fully Settled Up" description="You have no outstanding payment settlements." />
          ) : (
            <div className="space-y-3.5">
              {data.pendingSettlements.map((settlement) => (
                <div
                  key={settlement._id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#E9E2FF] bg-[#F8F5FF]/50 hover:bg-[#F8F5FF] hover:border-[#D0C6FF] transition-all duration-350"
                >
                  <Avatar src={settlement.from?.photo} name={settlement.from?.fullName} size="sm" className="ring-2 ring-[#EDE8FF]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1E1B4B] text-xs font-bold truncate">
                      <span className="text-[#EF4444]">{settlement.from?.fullName.split(' ')[0]}</span>
                      <span className="text-[#6B5CA5] font-semibold"> owes </span>
                      <span className="text-[#22C55E]">{settlement.to?.fullName.split(' ')[0]}</span>
                    </p>
                    <p className="text-[#6B5CA5] text-[9px] font-bold uppercase tracking-wider mt-1.5 truncate">Folder: {settlement.trip?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#1E1B4B] font-extrabold text-xs">₹{formatCurrency(settlement.amount)}</p>
                    <Badge variant={settlement.status === 'requested' ? 'warning' : 'gray'} className="mt-1.5 text-[8px]">
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