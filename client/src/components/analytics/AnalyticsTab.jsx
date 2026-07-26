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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Filler);

const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package,
};
const CAT_COLORS = ['#6D4AFF','#8B5CF6','#A855F7','#C084FC','#22C55E','#F59E0B','#EF4444','#06B6D4','#3B82F6','#64748B'];

const chartBase = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#6B5CA5', font: { size: 11, family: 'Inter', weight: '600' }, padding: 12 } },
    tooltip: { backgroundColor: '#ffffff', borderColor: '#E9E2FF', borderWidth: 1, titleColor: '#1E1B4B', bodyColor: '#6B5CA5', titleFont: { family: 'Inter', weight: 'bold' }, bodyFont: { family: 'Inter' } },
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

  if (isLoading) return <div className="flex-center py-12"><Spinner /></div>;
  if (!data) return <EmptyState icon={<BarChart3 size={32} className="text-[#6D4AFF]" />} title="No data available" />;

  const { categoryBreakdown = {}, expenses = [] } = data;

  const catLabels = Object.keys(categoryBreakdown);
  const catValues = Object.values(categoryBreakdown);

  const doughnutData = {
    labels: catLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: catValues, backgroundColor: CAT_COLORS, borderWidth: 0, hoverBorderWidth: 2, hoverBorderColor: '#fff' }],
  };

  // Member contribution bar
  const contributions = contribData?.contributions || [];
  const memberBarData = {
    labels: contributions.map(c => c.user?.fullName?.split(' ')[0] || '?'),
    datasets: [
      {
        label: 'Paid (₹)', data: contributions.map(c => c.stats?.totalPaid || 0),
        backgroundColor: 'rgba(109, 74, 255, 0.85)', borderColor: '#6D4AFF', borderWidth: 2, borderRadius: 6,
      },
      {
        label: 'Share (₹)', data: contributions.map(c => c.stats?.totalShare || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.85)', borderColor: '#8B5CF6', borderWidth: 2, borderRadius: 6,
      },
    ],
  };

  // Daily spending line
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
      borderColor: '#6D4AFF',
      backgroundColor: 'rgba(109, 74, 255, 0.05)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6D4AFF',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }],
  };

  const scaleOpts = {
    x: { ticks: { color: '#6B5CA5', font: { family: 'Inter' } }, grid: { color: 'rgba(109, 74, 255, 0.04)' } },
    y: { ticks: { color: '#6B5CA5', font: { family: 'Inter' }, callback: v => `₹${v}` }, grid: { color: 'rgba(109, 74, 255, 0.04)' } },
  };

  const summaryCards = [
    { label: 'Total Expense', value: `₹${formatCurrency(data.totalExpense)}`, Icon: Wallet, color: 'text-[#6D4AFF]' },
    { label: 'Expenses', value: data.expenseCount, Icon: Receipt, color: 'text-amber-500' },
    { label: 'Members', value: data.trip?.members?.length, Icon: Users, color: 'text-blue-500' },
    { label: 'Top Category', value: catLabels.length ? catLabels.reduce((a, b) => categoryBreakdown[a] > categoryBreakdown[b] ? a : b) : '—', Icon: BarChart3, color: 'text-[#8B5CF6]' },
  ];

  return (
    <div className="space-y-6 text-[#1E1B4B]">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <div key={i} className="bg-[#F8F5FF] border border-[#E9E2FF] p-4 rounded-xl text-center shadow-inner">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-white border border-[#E9E2FF] flex items-center justify-center">
              <s.Icon size={14} className={s.color} />
            </div>
            <p className={`font-extrabold text-base ${s.color} capitalize`}>{s.value}</p>
            <p className="text-[#6B5CA5] text-xs mt-1 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="bg-white border border-[#E9E2FF] p-4 rounded-xl shadow-sm">
          <h4 className="font-extrabold text-[#1E1B4B] mb-4 text-sm">Expenses by Category</h4>
          {catValues.length ? (
            <div className="h-64 flex-center">
              <Doughnut data={doughnutData} options={{ ...chartBase, cutout: '60%' }} />
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={28} className="text-[#6D4AFF]" />} title="No data" />
          )}
        </div>

        {/* Member Contributions */}
        <div className="bg-white border border-[#E9E2FF] p-4 rounded-xl shadow-sm">
          <h4 className="font-extrabold text-[#1E1B4B] mb-4 text-sm">Member Contributions</h4>
          {contributions.length ? (
            <div className="h-64 flex-center">
              <Bar data={memberBarData} options={{ ...chartBase, scales: scaleOpts }} />
            </div>
          ) : (
            <EmptyState icon={<Users size={28} className="text-[#6D4AFF]" />} title="No data" />
          )}
        </div>
      </div>

      {/* Daily Spending */}
      <div className="bg-white border border-[#E9E2FF] p-4 rounded-xl shadow-sm">
        <h4 className="font-extrabold text-[#1E1B4B] mb-4 text-sm">Daily Spending Trend</h4>
        {Object.keys(dailyMap).length ? (
          <div className="h-64 flex-center">
            <Line data={lineData} options={{ ...chartBase, scales: scaleOpts }} />
          </div>
        ) : (
          <EmptyState icon={<Wallet size={28} className="text-[#6D4AFF]" />} title="No spending data" />
        )}
      </div>

      {/* Category breakdown table */}
      <div className="bg-white border border-[#E9E2FF] p-4 rounded-xl shadow-sm">
        <h4 className="font-extrabold text-[#1E1B4B] mb-4 text-sm">Category Breakdown</h4>
        <div className="space-y-3">
          {catLabels.sort((a, b) => categoryBreakdown[b] - categoryBreakdown[a]).map((cat, i) => {
            const pct = data.totalExpense > 0 ? (categoryBreakdown[cat] / data.totalExpense * 100).toFixed(1) : 0;
            const CatIcon = CAT_ICONS[cat] || Package;
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F8F5FF] border border-[#E9E2FF] flex-center flex-shrink-0">
                  <CatIcon size={13} className="text-[#6D4AFF]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#6B5CA5] text-xs font-semibold capitalize">{cat}</span>
                    <span className="text-[#1E1B4B] text-xs font-bold">₹{formatCurrency(categoryBreakdown[cat])} <span className="text-[#6B5CA5]/60 font-semibold">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-[#F3F0FF] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
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
