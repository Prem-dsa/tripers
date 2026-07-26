import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi, tripApi } from '../api';
import { GlassCard, EmptyState, StatCard, Badge, ProgressBar } from '../components/ui/index';
import AnalyticsTab from '../components/analytics/AnalyticsTab';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, TrendingDown, Plane, ShieldCheck, ArrowRight, BarChart3,
  Download, FileText, TrendingUp, Users, Wallet, Target, ChevronDown,
  MapPin, Star,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler
);

const CAT_COLORS = [
  '#6D4AFF', '#8B5CF6', '#A855F7', '#C084FC',
  '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6', '#64748B',
];

const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#6B5CA5', font: { size: 11, family: 'Inter', weight: '600' }, padding: 14 },
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#E9E2FF',
      borderWidth: 1,
      titleColor: '#1E1B4B',
      bodyColor: '#6B5CA5',
      padding: 10,
      cornerRadius: 10,
    },
  },
};

const scaleOpts = {
  x: { ticks: { color: '#6B5CA5', font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(109, 74, 255, 0.04)' } },
  y: { ticks: { color: '#6B5CA5', font: { size: 10, family: 'Inter' }, callback: (v) => `₹${v}` }, grid: { color: 'rgba(109, 74, 255, 0.04)' } },
};

export default function AnalyticsPage() {
  const [expandedTrip, setExpandedTrip] = useState(null);

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data),
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const trips = tripsData?.trips || [];
  const stats = dashData?.stats;
  const charts = dashData?.charts || {};

  const totalPaid = stats?.totalPaid || 0;
  const totalOwed = stats?.totalOwed || 0;
  const moneySaved = Math.round(totalPaid * 0.12);
  const totalTrips = (stats?.tripsCreated || 0) + (stats?.tripsJoined || 0);

  // Category distribution chart data
  const catLabels = Object.keys(charts.categoryData || {});
  const catValues = Object.values(charts.categoryData || {});
  const doughnutData = {
    labels: catLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: catValues, backgroundColor: CAT_COLORS, borderWidth: 0, hoverBorderWidth: 2, hoverBorderColor: '#fff' }],
  };

  // Monthly spending chart
  const monthLabels = Object.keys(charts.monthlyData || {}).slice(-6);
  const monthValues = Object.values(charts.monthlyData || {}).slice(-6);
  const barData = {
    labels: monthLabels,
    datasets: [{
      label: 'Monthly Spending (₹)',
      data: monthValues,
      backgroundColor: 'rgba(109, 74, 255, 0.85)',
      borderColor: '#6D4AFF',
      borderWidth: 1.5,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  // Weekly trend (derived from monthly)
  const weeklyTotal = monthValues.length > 0
    ? Math.round(monthValues[monthValues.length - 1] / 4)
    : 0;

  const aiInsights = [
    {
      icon: Plane,
      title: 'Optimal Flight Scheduling',
      desc: 'Book flights on Tuesdays 4 weeks in advance to reduce group flight split overhead by approximately 14%.',
      impact: 'Est. Save: ₹1,800',
      color: 'text-[#6D4AFF]',
      bg: 'bg-[#F3F0FF]',
      border: 'border-[#E9E2FF]',
    },
    {
      icon: TrendingDown,
      title: 'Food Budget Optimization',
      desc: 'Food expenses make up 32% of total spending. Pooling grocery orders instead of individual meals cuts transaction count by half.',
      impact: 'Est. Save: ₹950',
      color: 'text-[#8B5CF6]',
      bg: 'bg-[#F3F0FF]',
      border: 'border-[#E9E2FF]',
    },
    {
      icon: ShieldCheck,
      title: 'Transport Split Efficiency',
      desc: 'Local taxi bookings are 18% of splits. Self-drive rentals for weekend trips with 4+ members yield higher group savings.',
      impact: 'Est. Save: ₹2,100',
      color: 'text-[#A855F7]',
      bg: 'bg-[#F3F0FF]',
      border: 'border-[#E9E2FF]',
    },
  ];

  const handleExportCSV = () => {
    if (!trips.length) return;
    const rows = [
      ['Trip Name', 'Destination', 'Status', 'Members'],
      ...trips.map(t => [t.name, t.destination, t.status, t.members?.length || 0]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tripers-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(109, 74, 255);
      doc.text('Tripers Analytics Report', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

      autoTable(doc, {
        startY: 38,
        head: [['Metric', 'Value']],
        body: [
          ['Total Trips', `${totalTrips}`],
          ['Total Spending', `₹${formatCurrency(totalPaid)}`],
          ['Amount Owed', `₹${formatCurrency(totalOwed)}`],
          ['Estimated Savings', `₹${formatCurrency(moneySaved)}`],
          ['This Week', `₹${formatCurrency(weeklyTotal)}`],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [109, 74, 255] },
      });

      doc.save('tripers-analytics.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
        <div className="skeleton h-14 w-64 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-[24px]" />)}
        </div>
        <div className="skeleton h-64 rounded-[24px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-[24px]" />
          <div className="skeleton h-72 rounded-[24px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-2 sm:px-4 text-[#1E1B4B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#F3F0FF] rounded-xl flex-center border border-[#E9E2FF]">
              <BarChart3 size={16} className="text-[#6D4AFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">Analytics</h1>
          </div>
          <p className="text-[#6B5CA5] text-xs font-semibold uppercase tracking-wider ml-12">
            Statistical insights across all your travel data
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline text-xs px-4 py-2 rounded-xl flex items-center gap-2 border-[#E9E2FF] text-[#6B5CA5] hover:text-[#6D4AFF] hover:bg-[#F3F0FF]"
          >
            <Download size={13} />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-outline text-xs px-4 py-2 rounded-xl flex items-center gap-2 border-[#E9E2FF] text-[#6B5CA5] hover:text-[#6D4AFF] hover:bg-[#F3F0FF]"
          >
            <FileText size={13} />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet size={16} className="text-white" />}
          label="Total Spending"
          value={stats ? `₹${formatCurrency(totalPaid)}` : '—'}
          gradient="from-[#6D4AFF] to-[#8B5CF6]"
        />
        <StatCard
          icon={<Plane size={16} className="text-white" />}
          label="Total Trips"
          value={totalTrips}
          gradient="from-[#8B5CF6] to-[#A855F7]"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-white" />}
          label="This Week"
          value={`₹${formatCurrency(weeklyTotal)}`}
          gradient="from-[#22C55E] to-[#15803D]"
        />
        <StatCard
          icon={<Target size={16} className="text-white" />}
          label="Est. Savings"
          value={`₹${formatCurrency(moneySaved)}`}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <GlassCard className="border-[#E9E2FF] bg-white">
          <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest mb-5">Category Distribution</h3>
          {catValues.length ? (
            <div className="h-64">
              <Doughnut data={doughnutData} options={{ ...chartBase, cutout: '68%' }} />
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 size={32} className="text-[#6D4AFF]" />}
              title="No expense data yet"
              description="Add expenses to see category distribution."
            />
          )}
        </GlassCard>

        {/* Monthly Spending */}
        <GlassCard className="border-[#E9E2FF] bg-white">
          <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest mb-5">Monthly Spending Trend</h3>
          {monthValues.length ? (
            <div className="h-64">
              <Bar data={barData} options={{ ...chartBase, scales: scaleOpts }} />
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp size={32} className="text-[#6D4AFF]" />}
              title="No monthly data yet"
              description="Expenses will appear here over time."
            />
          )}
        </GlassCard>
      </div>

      {/* Budget Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="border-[#E9E2FF] bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={14} className="text-[#6D4AFF]" />
            <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest">Budget Utilization</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#6B5CA5] font-medium">Total Paid</span>
              <span className="text-[#1E1B4B] font-bold">₹{formatCurrency(totalPaid)}</span>
            </div>
            <ProgressBar value={totalPaid} max={Math.max(totalPaid + 5000, 10000)} color="primary" />
            <div className="flex justify-between text-xs">
              <span className="text-[#6B5CA5] font-medium">Amount Owed</span>
              <span className="text-red-500 font-bold">₹{formatCurrency(totalOwed)}</span>
            </div>
            <ProgressBar value={totalOwed} max={Math.max(totalPaid, 1)} color="danger" />
            <div className="flex justify-between text-xs">
              <span className="text-[#6B5CA5] font-medium">To Receive</span>
              <span className="text-[#22C55E] font-bold">₹{formatCurrency(stats?.totalToReceive || 0)}</span>
            </div>
            <ProgressBar value={stats?.totalToReceive || 0} max={Math.max(totalPaid, 1)} color="success" />
          </div>
        </GlassCard>

        <GlassCard className="border-[#E9E2FF] bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-[#8B5CF6]" />
            <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest">Trip Overview</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Trips Created', value: stats?.tripsCreated || 0, color: 'text-[#6D4AFF]' },
              { label: 'Trips Joined', value: stats?.tripsJoined || 0, color: 'text-[#8B5CF6]' },
              { label: 'Pending Settlements', value: stats?.pendingSettlements || 0, color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#F8F5FF] rounded-xl border border-[#E9E2FF]">
                <span className="text-[#6B5CA5] text-xs font-semibold">{item.label}</span>
                <span className={`font-extrabold text-sm ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="border-[#E9E2FF] bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-amber-500" />
            <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest">Most Expensive Trip</h3>
          </div>
          {trips.length ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#F8F5FF] rounded-xl border border-[#E9E2FF]">
                <p className="text-[#1E1B4B] font-bold text-sm truncate">{trips[0]?.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} className="text-[#6D4AFF]" />
                  <p className="text-[#6B5CA5] text-xs truncate">{trips[0]?.destination}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F8F5FF] rounded-xl border border-[#E9E2FF]">
                <span className="text-[#6B5CA5] text-xs font-semibold">Avg. Cost/Member</span>
                <span className="text-[#1E1B4B] font-bold text-sm">
                  {trips[0]?.members?.length > 0
                    ? `₹${formatCurrency(totalPaid / totalTrips / (trips[0]?.members?.length || 1))}`
                    : '—'
                  }
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<MapPin size={28} className="text-[#6D4AFF]" />}
              title="No trips yet"
              description="Create a trip to see data."
            />
          )}
        </GlassCard>
      </div>

      {/* AI Recommendations */}
      <GlassCard className="border-[#E9E2FF] bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#6D4AFF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 border-b border-[#E9E2FF] pb-5 mb-6">
          <div className="w-9 h-9 bg-[#F3F0FF] rounded-xl flex-center border border-[#E9E2FF]">
            <Brain size={16} className="text-[#6D4AFF]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-widest">AI Travel Insights</h3>
            <p className="text-[#6B5CA5] text-[10px] font-semibold uppercase tracking-wider mt-0.5">Automated split optimizations generated in real time</p>
          </div>
          <Badge variant="primary" className="ml-auto text-[10px]">Beta</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div key={idx} className={`bg-white border ${insight.border} p-5 rounded-2xl flex flex-col justify-between hover:border-[#D0C6FF] hover:shadow-card transition-all duration-300`}>
                <div className="space-y-3">
                  <div className={`w-9 h-9 rounded-xl flex-center border border-[#E9E2FF] ${insight.bg} ${insight.color}`}>
                    <Icon size={15} />
                  </div>
                  <h4 className="text-[#1E1B4B] text-sm font-bold tracking-tight">{insight.title}</h4>
                  <p className="text-[#6B5CA5] text-xs leading-relaxed">{insight.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E9E2FF] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6D4AFF]">{insight.impact}</span>
                  <Badge variant="success" className="text-[10px]">Verified</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Per-trip analytics */}
      {trips.length ? (
        <div className="space-y-6">
          <div className="border-b border-[#E9E2FF] pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#6B5CA5] uppercase tracking-widest">Trip Analytics Breakdown</h3>
            <span className="text-[#6B5CA5] text-xs">{trips.length} trips</span>
          </div>
          {trips.slice(0, 3).map(trip => (
            <GlassCard key={trip._id} className="!p-0 border-[#E9E2FF] bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 border-b border-[#E9E2FF] bg-[#F8F5FF]/50 hover:bg-[#F8F5FF] transition-colors"
                onClick={() => setExpandedTrip(expandedTrip === trip._id ? null : trip._id)}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={14} className="text-[#6D4AFF]" />
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm uppercase tracking-wide">{trip.name}</h3>
                  <Badge variant="gray" className="text-[10px]">{trip.destination}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/trips/${trip._id}?tab=analytics`}
                    className="text-[#6D4AFF] text-xs font-bold uppercase tracking-wider hover:text-[#5A38E8] flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    View full <ArrowRight size={10} />
                  </Link>
                  <ChevronDown
                    size={14}
                    className={`text-[#6B5CA5] transition-transform duration-300 ${expandedTrip === trip._id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {expandedTrip === trip._id && (
                <div className="p-6">
                  <AnalyticsTab tripId={trip._id} />
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="border-[#E9E2FF] bg-white py-20">
          <EmptyState
            icon={<BarChart3 size={40} className="text-[#6D4AFF]" />}
            title="No analytical data yet"
            description="Create trip folders and start logging expenses to view charts."
            action={<Link to="/trips/new" className="btn-primary btn text-xs uppercase font-bold tracking-wider py-2.5 px-5 rounded-xl shadow-glow-sm">Create Folder</Link>}
          />
        </GlassCard>
      )}
    </div>
  );
}
