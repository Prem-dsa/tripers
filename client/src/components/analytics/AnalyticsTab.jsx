import { useQuery } from '@tanstack/react-query';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler
} from 'chart.js';
import { reportApi } from '../../api';
import { EmptyState, Spinner } from '../ui/index';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import {
  Wallet, Receipt, Users, BarChart3,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Plane, Train, Ticket, Stethoscope, Package,
} from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Filler);

const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package,
};
const CAT_COLORS = ['#7C5CFC','#A78BFA','#C084FC','#E9D5FF','#34D399','#FBBF24','#F87171','#22D3EE','#60A5FA','#94A3B8'];

const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#64748B', font: { size: 11, family: 'Inter', weight: '600' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, titleColor: '#1E293B', bodyColor: '#64748B', padding: 14, cornerRadius: 16 },
  },
};

export default function AnalyticsTab({ tripId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-summary', tripId],
    queryFn: () => reportApi.getSummary(tripId).then(r => r.data),
  });

  const { data: contribData } = useQuery({
    queryKey: ['report-contrib', tripId],
    queryFn: () => reportApi.getContributions(tripId).then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  if (!data) return <EmptyState icon={<BarChart3 size={32} className="text-primary-500" />} title="No data available" />;

  const { categoryBreakdown = {}, expenses = [] } = data;

  const catLabels = Object.keys(categoryBreakdown);
  const catValues = Object.values(categoryBreakdown);

  const doughnutData = {
    labels: catLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: catValues, backgroundColor: CAT_COLORS, borderWidth: 0, hoverBorderWidth: 3, hoverBorderColor: '#fff', spacing: 2 }],
  };

  const contributions = contribData?.contributions || [];
  const memberBarData = {
    labels: contributions.map(c => c.user?.fullName?.split(' ')[0] || '?'),
    datasets: [
      {
        label: 'Paid (₹)', data: contributions.map(c => c.stats?.totalPaid || 0),
        backgroundColor: 'rgba(124, 92, 252, 0.8)', borderColor: 'rgba(124, 92, 252, 1)', borderWidth: 0, borderRadius: 8,
      },
      {
        label: 'Share (₹)', data: contributions.map(c => c.stats?.totalShare || 0),
        backgroundColor: 'rgba(167, 139, 250, 0.8)', borderColor: 'rgba(167, 139, 250, 1)', borderWidth: 0, borderRadius: 8,
      },
    ],
  };

  const dailyMap = {};
  expenses.forEach(e => {
    const day = format(new Date(e.date), 'MMM d');
    dailyMap[day] = (dailyMap[day] || 0) + e.amount;
  });
  const lineData = {
    labels: Object.keys(dailyMap),
    datasets: [{
      label: 'Daily Spending (₹)',
      data: Object.values(dailyMap),
      borderColor: '#7C5CFC',
      backgroundColor: 'rgba(124, 92, 252, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#7C5CFC',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }],
  };

  const scaleOpts = {
    x: { ticks: { color: '#94A3B8', font: { size: 10, family: 'Inter', weight: '600' } }, grid: { color: 'rgba(148,163,184,0.08)' }, border: { display: false } },
    y: { ticks: { color: '#94A3B8', font: { size: 10, family: 'Inter', weight: '600' }, callback: v => `₹${v}` }, grid: { color: 'rgba(148,163,184,0.08)' }, border: { display: false } },
  };

  const summaryCards = [
    { label: 'Total Expense', value: `₹${formatCurrency(data.totalExpense)}`, Icon: Wallet, gradient: 'from-primary-500 to-purple-500' },
    { label: 'Expenses', value: data.expenseCount, Icon: Receipt, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Members', value: data.trip?.members?.length, Icon: Users, gradient: 'from-cyan-500 to-blue-500' },
    { label: 'Top Category', value: catLabels.length ? catLabels.reduce((a, b) => categoryBreakdown[a] > categoryBreakdown[b] ? a : b) : '—', Icon: BarChart3, gradient: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-5 rounded-[24px] text-center shadow-sm hover:shadow-float transition-all duration-300"
          >
            <div className={`w-10 h-10 mx-auto mb-3 rounded-[14px] bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
              <s.Icon size={18} className="text-white" />
            </div>
            <p className="font-extrabold text-slate-800 text-lg capitalize">{s.value}</p>
            <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] shadow-sm">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Expenses by Category</h4>
          {catValues.length ? (
            <div className="h-64">
              <Doughnut data={doughnutData} options={{ ...chartBase, cutout: '70%' }} />
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={28} className="text-primary-500" />} title="No data" />
          )}
        </div>

        {/* Member Contributions */}
        <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] shadow-sm">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Member Contributions</h4>
          {contributions.length ? (
            <div className="h-64">
              <Bar data={memberBarData} options={{ ...chartBase, scales: scaleOpts }} />
            </div>
          ) : (
            <EmptyState icon={<Users size={28} className="text-primary-500" />} title="No data" />
          )}
        </div>
      </div>

      {/* Daily Spending */}
      <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] shadow-sm">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Daily Spending Trend</h4>
        {Object.keys(dailyMap).length ? (
          <div className="h-64">
            <Line data={lineData} options={{ ...chartBase, scales: scaleOpts }} />
          </div>
        ) : (
          <EmptyState icon={<Wallet size={28} className="text-primary-500" />} title="No spending data" />
        )}
      </div>

      {/* Category breakdown table */}
      <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] shadow-sm">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Category Breakdown</h4>
        <div className="space-y-4">
          {catLabels.sort((a, b) => categoryBreakdown[b] - categoryBreakdown[a]).map((cat, i) => {
            const pct = data.totalExpense > 0 ? (categoryBreakdown[cat] / data.totalExpense * 100).toFixed(1) : 0;
            const CatIcon = CAT_ICONS[cat] || Package;
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CatIcon size={14} className="text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5 text-xs">
                    <span className="text-slate-600 font-bold capitalize">{cat}</span>
                    <span className="text-slate-800 font-bold">₹{formatCurrency(categoryBreakdown[cat])} <span className="text-slate-400 font-medium">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
