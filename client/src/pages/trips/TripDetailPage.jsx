import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Plane, Users, DollarSign, Image as ImageIcon, MessageCircle, BarChart3, FileText,
  Share2, MapPin, Calendar, Copy, Check, Edit, ArrowLeft,
  Wallet, Send, Mail, Sun, CloudRain, CloudLightning, Cloud,
  XCircle, ArrowDownToLine, ArrowUpFromLine, Hotel, Utensils, Compass, CheckSquare,
  ShieldCheck, FileCheck, QrCode, Sparkles, Navigation
} from 'lucide-react';
import { clsx } from 'clsx';
import { tripApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { GlassCard, Avatar, Badge, StatCard, EmptyState, Spinner, ProgressBar } from '../../components/ui/index';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/currency';
import ExpensesList from '../../components/expenses/ExpensesList';
import SettlementsTab from '../../components/settlements/SettlementsTab';
import GalleryTab from '../../components/gallery/GalleryTab';
import ChatTab from '../../components/chat/ChatTab';
import AnalyticsTab from '../../components/analytics/AnalyticsTab';
import ReportsTab from '../../components/reports/ReportsTab';
import MembersTab from '../../components/trips/MembersTab';
import InteractiveTravelMap from '../../components/map/InteractiveTravelMap';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'overview', label: 'Overview', icon: Plane },
  { key: 'expenses', label: 'Expenses', icon: DollarSign },
  { key: 'members', label: 'Travelers', icon: Users },
  { key: 'settlements', label: 'Settlements', icon: Wallet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'gallery', label: 'Media', icon: ImageIcon },
  { key: 'chat', label: 'Chat', icon: MessageCircle },
  { key: 'reports', label: 'Export', icon: FileText },
];

export default function TripDetailPage() {
  const { id: routeId, tripId } = useParams();
  const id = tripId || routeId;
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [qrModal, setQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripApi.getOne(id).then((r) => r.data),
  });

  const { data: qrData } = useQuery({
    queryKey: ['trip-qr', id],
    queryFn: () => tripApi.getQR(id).then((r) => r.data),
    enabled: qrModal,
  });

  const addMemberMutation = useMutation({
    mutationFn: (emailOrUsername) => tripApi.addMember(id, { emailOrUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', id]);
      toast.success('Traveler added successfully! 🎉');
      setInviteInput('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to invite traveler.');
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    addMemberMutation.mutate(inviteInput.trim());
  };

  const trip = data?.trip;
  const memberStats = data?.memberStats || [];
  const currentMembership = trip?.members?.find(m => (m.user?._id || m.user) === user?._id);
  const isAdmin = trip?.createdBy?._id === user?._id || currentMembership?.role === 'admin';
  const budgetPct = trip?.budget > 0 ? Math.min(100, ((trip.totalExpense || 0) / trip.budget) * 100) : 0;

  const copyInviteLink = () => {
    if (!qrData?.inviteUrl) return;
    navigator.clipboard.writeText(qrData.inviteUrl);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Spinner size="lg" className="border-indigo-400 mx-auto" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Loading Trip Data...</p>
        </div>
      </div>
    );
  }

  if (!trip) return (
    <GlassCard className="max-w-2xl mx-auto mt-12">
      <EmptyState
        icon={<XCircle size={40} className="text-rose-400 stroke-[1.5]" />}
        title="Trip not found"
        description="The folder does not exist or you do not have permission to view it."
        action={
          <button onClick={() => navigate('/trips')} className="btn-primary py-3 px-8 mt-4 font-bold tracking-wide shadow-glow">
            Back to Trips
          </button>
        }
      />
    </GlassCard>
  );

  const myStats = memberStats.find((m) => m.user?._id === user?._id)?.stats;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 pb-4 text-white">
      {/* Back button */}
      <button
        onClick={() => navigate('/trips')}
        className="flex items-center gap-2 text-indigo-300 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 w-fit"
      >
        <ArrowLeft size={16} className="stroke-[2.5]" />
        <span>Back to Trips</span>
      </button>

      {/* Hero Container Header */}
      <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden bg-white/10 backdrop-blur-[36px] border border-white/20 shadow-2xl">
        <div className="h-44 sm:h-64 lg:h-80 w-full relative">
          <img
            src={trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute top-4 right-4 flex gap-2">
            <Badge variant={trip.status === 'active' ? 'success' : 'primary'} className="backdrop-blur-md">
              {trip.status}
            </Badge>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1.5">
                <MapPin size={14} className="text-indigo-400 stroke-[2.5]" />
                <span>{trip.destination}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">{trip.name}</h1>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-purple-400" /> {trip.members?.length} Travelers</span>
                {trip.startDate && (
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> {new Date(trip.startDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setQrModal(true)}
                className="btn-secondary py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest"
              >
                <Share2 size={16} className="stroke-[2.5]" /> Invite
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/trips/${id}/edit`)}
                  className="btn-secondary py-3.5 px-6 rounded-full text-[11px] font-bold uppercase tracking-widest"
                >
                  <Edit size={16} className="stroke-[2.5]" /> Edit Trip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {myStats ? (
          <>
            <StatCard icon={<Wallet size={18} className="text-white stroke-[2.5]" />} label="Total Paid By Me" value={`₹${formatCurrency(myStats.totalPaid)}`} gradient="from-emerald-400 to-teal-500" />
            <StatCard icon={<BarChart3 size={18} className="text-white stroke-[2.5]" />} label="My Spending Share" value={`₹${formatCurrency(myStats.totalShare)}`} gradient="from-indigo-500 to-purple-500" />
            <StatCard icon={<ArrowDownToLine size={18} className="text-white stroke-[2.5]" />} label="To Receive (Net)" value={`₹${formatCurrency(myStats.toReceive)}`} gradient="from-amber-400 to-orange-500" />
            <StatCard icon={<ArrowUpFromLine size={18} className="text-white stroke-[2.5]" />} label="To Pay (Net)" value={`₹${formatCurrency(myStats.toPay)}`} gradient="from-rose-500 to-red-600" />
          </>
        ) : (
          <div className="lg:col-span-4 p-6 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest glass rounded-[24px]">
            You are not participating in active balance stats for this trip.
          </div>
        )}
      </div>

      {/* Budget progress bar */}
      {trip.budget > 0 && (
        <GlassCard className="!p-6" animate={false}>
          <div className="flex justify-between items-center text-xs font-semibold mb-3">
            <span className="text-indigo-300 uppercase tracking-[0.2em] text-[11px] font-bold">Remaining Balance</span>
            <span>
              <span className={clsx('font-extrabold text-[15px]', budgetPct >= 100 ? 'text-rose-400' : budgetPct >= 80 ? 'text-amber-400' : 'text-emerald-400')}>
                ₹{formatCurrency(trip.totalExpense || 0)}
              </span>
              <span className="text-slate-400 font-bold text-[13px]"> / ₹{formatCurrency(trip.budget)}</span>
            </span>
          </div>
          <ProgressBar value={trip.totalExpense || 0} max={trip.budget} color={budgetPct >= 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'primary'} />
        </GlassCard>
      )}

      {/* Tabs list */}
      <GlassCard className="!p-0 overflow-hidden" animate={false}>
        <div className="flex overflow-x-auto no-scrollbar border-b border-white/10 bg-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  navigate(`?tab=${tab.key}`, { replace: true });
                }}
                className={clsx(
                  'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3.5 sm:py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200 relative flex-shrink-0',
                  active ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-200'
                )}
              >
                <Icon size={14} className={clsx('z-10 flex-shrink-0', active ? 'text-indigo-400 stroke-[2.5]' : 'stroke-2')} />
                <span className="z-10 hidden sm:inline">{tab.label}</span>
                <span className="z-10 sm:hidden">{tab.label.slice(0, 4)}</span>
                {active && (
                  <motion.div
                    layoutId="detailActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel views */}
        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && <TripOverview trip={trip} memberStats={memberStats} />}
              {activeTab === 'expenses' && <ExpensesList tripId={id} isAdmin={isAdmin} />}
              {activeTab === 'members' && <MembersTab trip={trip} memberStats={memberStats} isAdmin={isAdmin} />}
              {activeTab === 'settlements' && <SettlementsTab tripId={id} />}
              {activeTab === 'analytics' && <AnalyticsTab tripId={id} />}
              {activeTab === 'gallery' && <GalleryTab tripId={id} />}
              {activeTab === 'chat' && <ChatTab tripId={id} />}
              {activeTab === 'reports' && <ReportsTab tripId={id} trip={trip} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Sharing Invite Modal */}
      <Modal isOpen={qrModal} onClose={() => setQrModal(false)} title="Invite Folder Members" size="sm">
        <div className="space-y-6 py-2 text-white">
          {qrData?.qrCode ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-white border border-white/20 rounded-[24px] shadow-lg flex items-center justify-center select-none">
                <img src={qrData.qrCode} alt="QR Code" className="w-40 h-40 object-contain rounded-xl" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Scan to connect</p>
            </div>
          ) : (
            <div className="skeleton w-40 h-40 rounded-[24px] mx-auto" />
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-2.5 bg-white/10 border border-white/20 p-5 rounded-[24px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Invite by Username/Email</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Enter email or username..."
                className="input py-3 px-4 text-[13px] font-medium bg-white/10 border-white/20 text-white shadow-sm flex-1 rounded-2xl"
                required
              />
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="btn-primary py-3 px-5 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-glow whitespace-nowrap"
              >
                {addMemberMutation.isPending ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function TripOverview({ trip, memberStats }) {
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Passport & Visa Copies', done: true },
    { id: 2, text: 'Flight & Hotel Vouchers', done: true },
    { id: 3, text: 'Universal Power Adapter', done: false },
    { id: 4, text: 'Emergency Forex Cash & Cards', done: false },
  ]);

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const totalExpense = memberStats.reduce((s, m) => s + (m.stats?.totalPaid || 0), 0) || 1;

  return (
    <div className="space-y-8 text-white">
      {/* Interactive Map Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Trip Location & Route Map</h3>
        <InteractiveTravelMap destination={trip.destination} />
      </div>

      {/* Travel Itinerary Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Day-Wise Itinerary Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { day: 'Day 1', title: 'Arrival & Check-in', items: ['✈️ Flight BOM → HND (Arrive 10:45 AM)', '🏨 Check-in at Ritz Carlton Tokyo', '🍣 Dinner at Gion Ramen Spot'] },
            { day: 'Day 2', title: 'Cultural Exploration', items: ['🏯 Morning Tour at Sensō-ji Temple', '🛍️ Shopping at Ginza District', '🗼 Sunset Views at Tokyo Tower'] },
          ].map((d, i) => (
            <div key={i} className="p-5 rounded-[24px] bg-white/10 border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{d.day}</Badge>
                <span className="text-white font-extrabold text-sm">{d.title}</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {d.items.map((it, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Travel Checklist & Document Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-[28px] bg-white/10 border border-white/20 space-y-4">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <CheckSquare size={16} /> Packing & Travel Checklist
          </h3>
          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/15 cursor-pointer transition-all duration-300"
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/30'}`}>
                  {item.done && <Check size={12} />}
                </div>
                <span className={`text-xs font-bold ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-white/10 border border-white/20 space-y-4">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck size={16} /> Digital Document Wallet
          </h3>
          <div className="space-y-3">
            {[
              { type: 'Passport Pass', code: 'IND-9021X', verified: true },
              { type: 'Flight E-Ticket', code: 'HND-BOM-88', verified: true },
              { type: 'Hotel Booking Voucher', code: 'RC-TOKYO-402', verified: true },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <FileCheck size={18} className="text-indigo-400" />
                  <div>
                    <p className="text-white font-bold text-xs">{doc.type}</p>
                    <p className="text-slate-400 text-[10px]">{doc.code}</p>
                  </div>
                </div>
                <Badge variant="success" className="text-[9px]">Verified PDF</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top contributors */}
      <div className="space-y-5">
        <div className="border-b border-white/15 pb-3">
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Travel Contributions</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {[...memberStats]
            .sort((a, b) => b.stats.totalPaid - a.stats.totalPaid)
            .map((ms) => {
              const sharePct = totalExpense > 0 ? Math.min(100, (ms.stats.totalPaid / totalExpense) * 100) : 0;
              return (
                <div key={ms.user?._id} className="flex items-center justify-between p-5 bg-white/10 border border-white/20 rounded-[24px] relative overflow-hidden group hover:bg-white/15 transition-all duration-300 shadow-md">
                  <div className="flex items-center gap-4 z-10">
                    <Avatar src={ms.user?.photo} name={ms.user?.fullName} size="md" className="ring-2 ring-white/30" />
                    <div>
                      <p className="text-white text-[15px] font-bold truncate max-w-[150px] group-hover:text-indigo-300 transition-colors">{ms.user?.fullName}</p>
                      <p className="text-slate-300 text-[10px] mt-1 font-bold uppercase tracking-widest">Paid: ₹{formatCurrency(ms.stats.totalPaid)}</p>
                    </div>
                  </div>
                  <div className="text-right z-10">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Balance</div>
                    {ms.stats.netBalance >= 0 ? (
                      <span className="text-emerald-400 text-[14px] font-extrabold">+₹{formatCurrency(ms.stats.toReceive)}</span>
                    ) : (
                      <span className="text-rose-400 text-[14px] font-extrabold">-₹{formatCurrency(ms.stats.toPay)}</span>
                    )}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity rounded-r-full"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
