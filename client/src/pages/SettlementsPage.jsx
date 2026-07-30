import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet, ArrowRight, CheckCircle, Clock, AlertCircle, X,
  RefreshCw, Send, Eye, Download, Search, Filter, Sparkles,
  TrendingUp, ArrowDownToLine, ArrowUpFromLine, Check, FileText,
  AlertTriangle, CreditCard, ChevronDown, Plus, QrCode
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { settlementApi, tripApi, userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { GlassCard, StatCard, Avatar, Badge, EmptyState, Spinner, ProgressBar } from '../components/ui/index';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const statusConfig = {
  pending:   { color: 'gray', icon: Clock, label: 'Pending' },
  requested: { color: 'warning', icon: AlertCircle, label: 'Payment Requested' },
  paid:      { color: 'primary', icon: Clock, label: 'Verification Pending' },
  confirmed: { color: 'success', icon: CheckCircle, label: 'Verified & Settled' },
  rejected:  { color: 'danger', icon: X, label: 'Verification Failed' },
};

const inputStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '14px',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#f1f5f9',
  outline: 'none',
};

export default function SettlementsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const pdfRef = useRef(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTripId, setSelectedTripId] = useState('');

  const [payModal, setPayModal] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [upiRef, setUpiRef] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch Dashboard & Trips
  const {
    data: dashboardData,
    isLoading: dashLoading,
    isError: dashError,
    refetch: refetchDash
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data),
  });

  const {
    data: tripsData,
    isLoading: tripsLoading,
    isError: tripsError,
    refetch: refetchTrips
  } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const trips = tripsData?.trips || [];

  // Fetch Settlements for all trips
  const {
    data: allSettlementsData,
    isLoading: settlementsLoading,
    isError: settlementsError,
    refetch: refetchSettlements
  } = useQuery({
    queryKey: ['all-settlements', trips.map(t => t._id).join(',')],
    queryFn: async () => {
      if (!trips.length) return [];
      const results = await Promise.all(
        trips.map(t =>
          settlementApi.getTripSettlements(t._id)
            .then(r => ({ trip: t, data: r.data }))
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: trips.length > 0,
  });

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: settlementApi.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries(['all-settlements']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Payment verified & confirmed! ✅');
    },
    onError: err => toast.error(err.response?.data?.message || 'Confirmation failed.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => settlementApi.reject(id, 'Verification failed.'),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-settlements']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Payment verification rejected.');
    },
    onError: () => toast.error('Rejection failed.'),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, data }) => settlementApi.markPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-settlements']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Marked as paid! Awaiting receiver confirmation. ⏳');
      setPayModal(null);
      setScreenshotFile(null);
      setUpiRef('');
    },
    onError: err => toast.error(err.response?.data?.message || 'Submission failed.'),
  });

  const openQR = async (settlement) => {
    try {
      const res = await settlementApi.getQR(settlement._id);
      setPayModal({
        _id: settlement._id,
        amount: settlement.amount,
        to: settlement.to,
        upiLink: res.data.upiLink,
        qrCode: res.data.qrCode,
      });
    } catch {
      setPayModal({
        _id: settlement._id,
        amount: settlement.amount,
        to: settlement.to,
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setUploading(true);
    const fd = new FormData();
    if (screenshotFile) fd.append('screenshot', screenshotFile);
    if (upiRef) fd.append('upiRef', upiRef);

    markPaidMutation.mutate({ id: payModal._id, data: fd }, {
      onSettled: () => setUploading(false)
    });
  };

  const triggerWhatsappReminder = (s, tripName) => {
    const text = `Hi ${s.from?.fullName}, friendly reminder to settle payment of ₹${s.amount} for our trip split (${tripName}). UPI: ${s.to?.upiId || ''}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadPDFReceipt = async (s, tripName) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Tripers Settlement Receipt', 20, 20);
    doc.setFontSize(12);
    doc.text(`Trip Folder: ${tripName}`, 20, 35);
    doc.text(`From: ${s.from?.fullName || 'N/A'}`, 20, 45);
    doc.text(`To: ${s.to?.fullName || 'N/A'}`, 20, 55);
    doc.text(`Amount: Rs. ${s.amount}`, 20, 65);
    doc.text(`Status: ${s.status}`, 20, 75);
    doc.text(`Date: ${new Date(s.createdAt || Date.now()).toLocaleDateString()}`, 20, 85);
    doc.save(`settlement-${s._id || 'receipt'}.pdf`);
    toast.success('Receipt PDF downloaded!');
  };

  const isLoading = dashLoading || tripsLoading;
  const isError = dashError || tripsError || settlementsError;

  // Aggregate Data
  let totalPending = 0;
  let totalPaid = 0;
  let totalToReceive = 0;
  let totalToPay = 0;

  const allTransactionsList = [];
  const allRecordsList = [];

  (allSettlementsData || []).forEach(item => {
    const trip = item.trip;
    const data = item.data;

    (data?.transactions || []).forEach(t => {
      allTransactionsList.push({ ...t, trip });
      if (t.to?._id === user?._id) totalToReceive += t.amount;
      if (t.from?._id === user?._id) totalToPay += t.amount;
    });

    (data?.existingSettlements || []).forEach(s => {
      allRecordsList.push({ ...s, trip });
      if (s.status === 'confirmed') totalPaid += s.amount;
      else totalPending += s.amount;
    });
  });

  const completionPct = (totalPaid + totalPending) > 0
    ? Math.round((totalPaid / (totalPaid + totalPending)) * 100)
    : 100;

  // Filtered List
  const filteredRecords = allRecordsList.filter(s => {
    const matchesTrip = !selectedTripId || s.trip._id === selectedTripId;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch = !search ||
      s.from?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.to?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.trip?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesTrip && matchesStatus && matchesSearch;
  });

  // Chart Data
  const chartLabels = trips.slice(0, 6).map(t => t.name);
  const chartPendingValues = trips.slice(0, 6).map(t => {
    const found = (allSettlementsData || []).find(s => s.trip._id === t._id);
    return (found?.data?.transactions || []).reduce((acc, curr) => acc + curr.amount, 0);
  });

  const barData = {
    labels: chartLabels.length ? chartLabels : ['No Active Trips'],
    datasets: [{
      label: 'Pending Settlement (₹)',
      data: chartPendingValues.length ? chartPendingValues : [0],
      backgroundColor: 'rgba(129, 140, 248, 0.8)',
      borderRadius: 8,
    }],
  };

  const doughnutData = {
    labels: ['Paid / Confirmed', 'Pending / Requested'],
    datasets: [{
      data: [totalPaid || 1, totalPending || 0],
      backgroundColor: ['#34D399', '#F87171'],
      borderWidth: 0,
    }],
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto pb-8">
        <div className="skeleton h-24 rounded-[28px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-[22px]" />)}
        </div>
        <div className="skeleton h-64 rounded-[28px]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <GlassCard className="!p-8">
          <AlertTriangle size={40} className="text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to load settlements</h2>
          <p className="text-slate-400 text-xs mb-6">Unable to connect to backend server or fetch settlement records.</p>
          <button
            onClick={() => { refetchDash(); refetchTrips(); refetchSettlements(); }}
            className="btn-primary rounded-full px-6 py-3 text-xs font-bold gap-2 shadow-glow"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-6 text-white" ref={pdfRef}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[14px] flex items-center justify-center shadow-glow flex-shrink-0">
            <Wallet size={18} className="text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">Settlements</h1>
            <p className="text-indigo-300/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Manage balances across all trips</p>
          </div>
        </div>
        <Link
          to="/trips"
          className="btn-primary rounded-full px-5 py-2.5 text-xs font-bold shadow-glow flex items-center gap-1.5"
        >
          <Plus size={15} /> <span>New Split</span>
        </Link>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Clock size={18} className="text-white stroke-[2.5]" />}
          label="Total Pending"
          value={`₹${formatCurrency(totalPending)}`}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={<CheckCircle size={18} className="text-white stroke-[2.5]" />}
          label="Total Paid"
          value={`₹${formatCurrency(totalPaid)}`}
          sub={`${completionPct}% Completed`}
          gradient="from-emerald-400 to-teal-500"
        />
        <StatCard
          icon={<ArrowDownToLine size={18} className="text-white stroke-[2.5]" />}
          label="To Receive"
          value={`₹${formatCurrency(totalToReceive)}`}
          gradient="from-indigo-500 to-purple-500"
        />
        <StatCard
          icon={<ArrowUpFromLine size={18} className="text-white stroke-[2.5]" />}
          label="To Pay"
          value={`₹${formatCurrency(totalToPay)}`}
          gradient="from-rose-500 to-red-500"
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Doughnut completion */}
        <GlassCard className="md:col-span-1">
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Pending vs Settled</h3>
          <div className="h-[180px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 10 } } } } }} />
          </div>
        </GlassCard>

        {/* Bar chart per trip */}
        <GlassCard className="md:col-span-2">
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Trip Settlement Breakdown</h3>
          <div className="h-[180px] w-full">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } }, plugins: { legend: { display: false } } }} />
          </div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="!p-3 sm:!p-4" animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or trip folder..."
              style={inputStyle}
              className="w-full pl-10 placeholder:text-slate-500 focus:border-indigo-400/60 transition-colors"
            />
          </div>

          {/* Trip Selector */}
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            style={{ ...inputStyle, width: 'auto' }}
            className="cursor-pointer"
          >
            <option value="" style={{ background: '#1e293b' }}>All Trips</option>
            {trips.map(t => (
              <option key={t._id} value={t._id} style={{ background: '#1e293b' }}>{t.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'pending', 'requested', 'paid', 'confirmed', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={clsx(
                  'text-[10px] uppercase font-bold tracking-widest px-3 py-2 rounded-xl transition-all flex-shrink-0 whitespace-nowrap',
                  statusFilter === st
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Recommended Settle Up Pathways */}
      {allTransactionsList.length > 0 && (
        <GlassCard>
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Recommended Settle Up Pathways</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allTransactionsList.map((t, i) => (
              <div
                key={i}
                className="p-3.5 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar src={t.from?.photo} name={t.from?.fullName} size="xs" />
                  <span className="text-white text-[12px] font-bold truncate max-w-[90px]">{t.from?.fullName?.split(' ')[0]}</span>
                  <ArrowRight size={12} className="text-indigo-400 flex-shrink-0" />
                  <Avatar src={t.to?.photo} name={t.to?.fullName} size="xs" />
                  <span className="text-white text-[12px] font-bold truncate max-w-[90px]">{t.to?.fullName?.split(' ')[0]}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-extrabold text-[13px]">₹{formatCurrency(t.amount)}</p>
                  <p className="text-indigo-300 text-[9px] font-semibold truncate max-w-[100px]">{t.trip?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Settlements Records List */}
      {!filteredRecords.length ? (
        <EmptyState
          icon={<Wallet size={36} className="text-indigo-400" />}
          title="No settlements found"
          description={search ? `No records matching "${search}"` : 'All settled up or no settlement records found.'}
          action={
            <Link to="/trips" className="btn-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-glow">
              Explore Trips
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredRecords.map((s) => {
              const cfg = statusConfig[s.status] || statusConfig.pending;
              const isFrom = s.from?._id === user?._id;
              const isTo = s.to?._id === user?._id;
              const StatusIcon = cfg.icon;

              return (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-white/30 transition-all"
                >
                  {/* From -> To */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={s.from?.photo} name={s.from?.fullName} size="sm" className="ring-2 ring-white/20 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[13px] font-bold truncate">
                        <span className="text-rose-400">{s.from?.fullName}</span>
                        <span className="text-slate-400 font-medium mx-1.5">owes</span>
                        <span className="text-emerald-400">{s.to?.fullName}</span>
                      </p>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">
                        Trip: {s.trip?.name}
                      </p>
                    </div>
                  </div>

                  {/* Amount, Status & Actions */}
                  <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-white font-extrabold text-base">₹{formatCurrency(s.amount)}</p>
                      <Badge variant={cfg.color} className="mt-1 text-[9px] gap-1">
                        <StatusIcon size={10} />
                        <span>{cfg.label}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View proof */}
                      {s.paymentScreenshot && (
                        <button
                          onClick={() => setScreenshotPreview(s.paymentScreenshot)}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                          title="View Screenshot"
                        >
                          <Eye size={15} />
                        </button>
                      )}

                      {/* Download PDF */}
                      <button
                        onClick={() => downloadPDFReceipt(s, s.trip?.name)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        title="Download PDF Receipt"
                      >
                        <Download size={15} />
                      </button>

                      {/* Receiver Actions */}
                      {s.status === 'requested' && isTo && (
                        <button
                          onClick={() => triggerWhatsappReminder(s, s.trip?.name)}
                          className="btn-success text-[10px] font-bold py-2 px-3 rounded-full flex items-center gap-1 min-h-[40px]"
                        >
                          <Send size={12} /> Reminder
                        </button>
                      )}

                      {s.status === 'paid' && isTo && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => confirmMutation.mutate(s._id)}
                            disabled={confirmMutation.isPending}
                            className="btn-success text-[10px] font-bold py-2 px-3 rounded-full min-h-[40px]"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(s._id)}
                            disabled={rejectMutation.isPending}
                            className="btn-danger text-[10px] font-bold py-2 px-3 rounded-full min-h-[40px]"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Payer Action */}
                      {(s.status === 'requested' || s.status === 'pending') && isFrom && (
                        <button
                          onClick={() => openQR(s)}
                          className="btn-primary text-[10px] font-bold py-2 px-4 rounded-full shadow-glow min-h-[40px] flex items-center gap-1.5"
                        >
                          <QrCode size={13} /> Pay UPI
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Payment checkout modal */}
      <Modal isOpen={!!payModal} onClose={() => { setPayModal(null); setScreenshotFile(null); setUpiRef(''); }} title="UPI Settlement Checkout" size="sm">
        {payModal && (
          <div className="space-y-4 py-2 text-center text-white">
            {payModal.qrCode ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-[22px] shadow-lg flex items-center justify-center select-none">
                  <img src={payModal.qrCode} alt="UPI QR Code" className="w-40 h-40 object-contain" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>
              </div>
            ) : (
              <div className="p-4 rounded-[18px] bg-white/8 border border-white/15">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
                <p className="text-2xl font-black text-white tracking-tight mt-1">₹{formatCurrency(payModal.amount)}</p>
                <p className="text-xs text-indigo-300 font-semibold mt-1">Pay to: {payModal.to?.fullName}</p>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3 pt-2 border-t border-white/10 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">UPI Ref / UTR No (Optional)</label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={e => setUpiRef(e.target.value)}
                  placeholder="Enter 12-digit UTR..."
                  style={inputStyle}
                  className="w-full placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Upload Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setScreenshotFile(e.target.files[0])}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || markPaidMutation.isPending}
                className="w-full btn-primary py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-glow min-h-[48px] mt-2"
              >
                {uploading || markPaidMutation.isPending ? 'Submitting Verification...' : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* Screenshot Preview Modal */}
      <Modal isOpen={!!screenshotPreview} onClose={() => setScreenshotPreview(null)} title="Payment Proof Screenshot" size="md">
        {screenshotPreview && (
          <div className="p-2 text-center">
            <img src={screenshotPreview} alt="Proof Screenshot" className="max-h-[70vh] w-auto mx-auto rounded-[18px] border border-white/20 shadow-2xl object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
