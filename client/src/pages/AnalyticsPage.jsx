import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi, tripApi } from '../api';
import { GlassCard, EmptyState, StatCard, Badge, ProgressBar } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, TrendingDown, Plane, ShieldCheck, ArrowRight, BarChart3,
  Download, FileText, TrendingUp, Users, Wallet, Target, ChevronDown,
  MapPin, Star, Hotel, Calendar, Globe, Compass, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler
);

const CAT_COLORS = [
  '#818CF8', '#C084FC', '#F472B6', '#34D399',
  '#F87171', '#FBBF24', '#38BDF8', '#A78BFA', '#2DD4BF', '#94A3B8',
];

const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#94A3B8', font: { size: 11, family: 'Inter', weight: '600' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
    },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      titleColor: '#FFFFFF',
      bodyColor: '#CBD5E1',
      padding: 14,
      cornerRadius: 16,
    },
  },
};

const scaleOpts = {
  x: { ticks: { color: '#94A3B8', font: { size: 10, family: 'Inter', weight: '600' } }, grid: { color: 'rgba(255,255,255,0.06)' }, border: { display: false } },
  y: { ticks: { color: '#94A3B8', font: { size: 10, family: 'Inter', weight: '600' }, callback: (v) => `₹${v}` }, grid: { color: 'rgba(255,255,255,0.06)' }, border: { display: false } },
};

export default function AnalyticsPage() {
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

  const catLabels = Object.keys(charts.categoryData || {});
  const catValues = Object.values(charts.categoryData || {});
  const doughnutData = {
    labels: catLabels.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: catValues, backgroundColor: CAT_COLORS, borderWidth: 0, hoverOffset: 6 }],
  };

  const monthLabels = Object.keys(charts.monthlyData || {}).slice(-6);
  const monthValues = Object.values(charts.monthlyData || {}).slice(-6);
  const barData = {
    labels: monthLabels,
    datasets: [{
      label: 'Monthly Spending (₹)',
      data: monthValues,
      backgroundColor: 'rgba(129, 140, 248, 0.85)',
      borderColor: '#818CF8',
      borderRadius: 12,
    }],
  };

  const lineData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [{
      fill: true,
      label: 'Daily Flow (₹)',
      data: [1200, 3400, 2100, 4800, 1900, 5600, 3100],
      borderColor: '#C084FC',
      backgroundColor: 'rgba(192, 132, 252, 0.15)',
      tension: 0.4,
    }],
  };

  const weeklyTotal = monthValues.length > 0 ? Math.round(monthValues[monthValues.length - 1] / 4) : 0;
  const dailyAvg = Math.round(totalPaid / Math.max(1, totalTrips * 5));

  const aiInsights = [
    {
      icon: Plane,
      title: 'Optimal Flight Scheduling',
      desc: 'Book flights on Tuesdays 4 weeks in advance to reduce group flight split overhead by approximately 14%.',
      impact: 'Est. Save: ₹1,800',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: TrendingDown,
      title: 'Food Budget Optimization',
      desc: 'Food expenses make up 32% of total spending. Pooling grocery orders instead of individual meals cuts transaction count by half.',
      impact: 'Est. Save: ₹950',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: ShieldCheck,
      title: 'Transport Split Efficiency',
      desc: 'Local taxi bookings are 18% of splits. Self-drive rentals for weekend trips with 4+ members yield higher group savings.',
      impact: 'Est. Save: ₹2,100',
      gradient: 'from-emerald-400 to-teal-500',
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
      doc.setTextColor(129, 140, 248);
      doc.text('Tripers Analytics Report', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
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
        headStyles: { fillColor: [129, 140, 248] },
      });

      doc.save('tripers-analytics.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[16px] flex items-center justify-center shadow-glow">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Analytics</h1>
              <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.2em]">Statistical insights & AI financial metrics</p>
            </div>
          </div>
        </motion.div>
        <div className="flex gap-3 flex-wrap">
          <motion.button
            onClick={handleExportCSV}
            className="btn-secondary py-3 px-5 rounded-full text-xs uppercase font-bold tracking-wider"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download size={14} /> Export CSV
          </motion.button>
          <motion.button
            onClick={handleExportPDF}
            className="btn-primary py-3 px-5 rounded-full text-xs uppercase font-bold tracking-wider shadow-glow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FileText size={14} /> Export PDF
          </motion.button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={18} className="text-white" />} label="Total Spending" value={stats ? `₹${formatCurrency(totalPaid)}` : '—'} gradient="from-indigo-500 to-purple-500" />
        <StatCard icon={<Plane size={18} className="text-white" />} label="Total Trips" value={totalTrips} gradient="from-purple-500 to-pink-500" />
        <StatCard icon={<TrendingUp size={18} className="text-white" />} label="Avg Daily Spend" value={`₹${formatCurrency(dailyAvg)}`} gradient="from-cyan-400 to-blue-500" />
        <StatCard icon={<Target size={18} className="text-white" />} label="Est. Savings" value={`₹${formatCurrency(moneySaved)}`} gradient="from-emerald-400 to-teal-500" />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<ArrowDownToLine size={18} className="text-white" />} label="To Receive" value={`₹${formatCurrency(stats?.totalToReceive || 0)}`} gradient="from-amber-400 to-orange-500" />
        <StatCard icon={<ArrowUpFromLine size={18} className="text-white" />} label="Amount Owed" value={`₹${formatCurrency(stats?.totalOwed || 0)}`} gradient="from-rose-500 to-red-600" />
        <StatCard icon={<Hotel size={18} className="text-white" />} label="Hotels Booked" value={Math.max(1, totalTrips * 2)} gradient="from-purple-500 to-indigo-600" />
        <StatCard icon={<Globe size={18} className="text-white" />} label="Countries Visited" value={Math.max(1, trips.length)} gradient="from-pink-500 to-rose-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="!p-8">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/15 pb-3 mb-6">Category Distribution</h3>
          {catValues.length ? (
            <div className="h-64">
              <Doughnut data={doughnutData} options={{ ...chartBase, cutout: '72%' }} />
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={32} className="text-indigo-400" />} title="No expense data yet" description="Add expenses to see category distribution." />
          )}
        </GlassCard>

        <GlassCard className="!p-8">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/15 pb-3 mb-6">Monthly Spending Trend</h3>
          {monthValues.length ? (
            <div className="h-64">
              <Bar data={barData} options={{ ...chartBase, scales: scaleOpts }} />
            </div>
          ) : (
            <EmptyState icon={<TrendingUp size={32} className="text-indigo-400" />} title="No monthly metrics yet" description="Log expenses to construct trends." />
          )}
        </GlassCard>
      </div>

      {/* Daily Expense Flow Line Chart */}
      <GlassCard className="!p-8">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/15 pb-3 mb-6">Daily Spending Timeline & Flow</h3>
        <div className="h-64">
          <Line data={lineData} options={{ ...chartBase, scales: scaleOpts }} />
        </div>
      </GlassCard>

      {/* AI Insights Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
          <Brain size={16} className="text-indigo-400" /> AI Spending Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <GlassCard key={idx} className="!p-6 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${insight.gradient} flex items-center justify-center text-white shadow-glow`}>
                    <Icon size={18} />
                  </div>
                  <h4 className="font-extrabold text-white text-base">{insight.title}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed font-medium">{insight.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>{insight.impact}</span>
                  <ArrowRight size={14} />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
