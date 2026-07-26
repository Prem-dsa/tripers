import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Plane, Users, DollarSign, Image, MessageCircle, BarChart3, FileText,
  Share2, MapPin, Calendar, Copy, Check, Edit, ArrowLeft,
  Wallet, Send, Mail, Sun, CloudRain, CloudLightning, Cloud,
  XCircle, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { format } from 'date-fns';
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
import toast from 'react-hot-toast';

const tabs = [
  { key: 'overview', label: 'Overview', icon: Plane },
  { key: 'expenses', label: 'Expenses', icon: DollarSign },
  { key: 'members', label: 'Travelers', icon: Users },
  { key: 'settlements', label: 'Settlements', icon: Wallet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'gallery', label: 'Media & Files', icon: Image },
  { key: 'chat', label: 'Activity Hub', icon: MessageCircle },
  { key: 'reports', label: 'Export & Notes', icon: FileText },
];

const getWeatherMock = (destination = '') => {
  const code = Math.abs(destination.charCodeAt(0) + (destination.charCodeAt(1) || 0)) % 4;
  const weathers = [
    { text: 'Sunny', temp: '28°C', icon: Sun, color: 'text-amber-500' },
    { text: 'Overcast', temp: '19°C', icon: Cloud, color: 'text-slate-500' },
    { text: 'Rainy', temp: '16°C', icon: CloudRain, color: 'text-sky-500' },
    { text: 'Thunderstorms', temp: '22°C', icon: CloudLightning, color: 'text-indigo-500' },
  ];
  return weathers[code];
};

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
      <div className="flex-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-[#6B5CA5] text-xs font-bold uppercase tracking-widest">Retrieving Trip Metrics...</p>
        </div>
      </div>
    );
  }

  if (!trip) return (
    <GlassCard className="bg-white border-[#E9E2FF]">
      <EmptyState
        icon={<XCircle size={32} className="text-[#6D4AFF]" />}
        title="Trip folder not found"
        description="The folder does not exist or you do not have permission to view it."
        action={
          <button onClick={() => navigate('/trips')} className="btn-primary btn text-[9px] uppercase font-bold tracking-wider py-2.5 px-6 rounded-xl">
            Back to Trips
          </button>
        }
      />
    </GlassCard>
  );

  const myStats = memberStats.find((m) => m.user?._id === user?._id)?.stats;
  const weather = getWeatherMock(trip.destination);
  const WeatherIcon = weather.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-2 sm:px-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/trips')}
        className="flex items-center gap-2 text-[#6B5CA5] hover:text-[#6D4AFF] text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
      >
        <ArrowLeft size={13} className="stroke-[2.5]" />
        <span>Back to Trips</span>
      </button>

      {/* Hero Banner Section */}
      <div className="relative rounded-[24px] overflow-hidden h-64 sm:h-80 border border-[#E9E2FF] shadow-card group">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#6D4AFF]/10 to-[#8B5CF6]/5 flex-center">
            <Plane size={48} className="text-[#6D4AFF]/30 animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Banner Details overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'gray' : 'primary'} className="mb-3">
                {trip.status}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{trip.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-white/80 text-xs font-semibold flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#6D4AFF]" /> {trip.destination}</span>
                {trip.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#6D4AFF]" />{' '}
                    {format(new Date(trip.startDate), 'MMM d')} – {trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : 'Ongoing'}
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Users size={13} className="text-[#6D4AFF]" /> {trip.members?.length} travelers</span>
                
                {/* Weather Display */}
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <WeatherIcon size={12} className={clsx("flex-shrink-0", weather.color)} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{weather.text} ({weather.temp})</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setQrModal(true)}
                className="btn text-[10px] tracking-wider font-bold uppercase py-2.5 px-5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white transition-all duration-300 active:scale-95 flex items-center gap-1.5"
              >
                <Share2 size={13} className="stroke-[2.5]" /> Invite
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/trips/${id}/edit`)}
                  className="btn text-[10px] tracking-wider font-bold uppercase py-2.5 px-5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 text-white transition-all duration-300 active:scale-95 flex items-center gap-1.5"
                >
                  <Edit size={13} /> Edit Trip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of details: stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {myStats ? (
          <>
            <StatCard icon={<Wallet size={16} className="text-white" />} label="Total Paid By Me" value={`₹${formatCurrency(myStats.totalPaid)}`} gradient="from-[#22C55E] to-[#15803D]" />
            <StatCard icon={<BarChart3 size={16} className="text-white" />} label="My Spending Share" value={`₹${formatCurrency(myStats.totalShare)}`} gradient="from-[#6D4AFF] to-[#8B5CF6]" />
            <StatCard icon={<ArrowDownToLine size={16} className="text-white" />} label="To Receive (Net)" value={`₹${formatCurrency(myStats.toReceive)}`} gradient="from-blue-500 to-indigo-650" />
            <StatCard icon={<ArrowUpFromLine size={16} className="text-white" />} label="To Pay (Net)" value={`₹${formatCurrency(myStats.toPay)}`} gradient="from-[#8B5CF6] to-[#A855F7]" />
          </>
        ) : (
          <div className="lg:col-span-4 p-4 text-center text-[#6B5CA5] text-xs font-semibold uppercase tracking-wider bg-white border border-[#E9E2FF] rounded-[24px]">
            You are not participating in active balance stats for this trip.
          </div>
        )}
      </div>

      {/* Budget progress bar */}
      {trip.budget > 0 && (
        <GlassCard className="!p-5 border-[#E9E2FF] bg-white" animate={false}>
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-[#6B5CA5] uppercase tracking-widest text-[10px] font-bold">Remaining Balance</span>
            <span>
              <span className={clsx('font-bold', budgetPct >= 100 ? 'text-[#EF4444]' : budgetPct >= 80 ? 'text-[#F59E0B]' : 'text-[#6D4AFF]')}>
                ₹{formatCurrency(trip.totalExpense || 0)}
              </span>
              <span className="text-[#6B5CA5] font-medium"> / ₹{formatCurrency(trip.budget)}</span>
            </span>
          </div>
          <ProgressBar value={trip.totalExpense || 0} max={trip.budget} color={budgetPct >= 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'primary'} />
        </GlassCard>
      )}

      {/* Tabs list with Spring layout indicator */}
      <GlassCard className="!p-0 border-[#E9E2FF] overflow-hidden bg-white" animate={false}>
        {/* Navigation list */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#E9E2FF] bg-[#F8F5FF]/50">
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
                  'flex items-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 relative flex-shrink-0 active:bg-[#F3F0FF]',
                  active ? 'text-[#6D4AFF]' : 'text-[#6B5CA5] hover:text-[#1E1B4B]'
                )}
              >
                <Icon size={14} className="z-10" />
                <span className="z-10">{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="detailActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6D4AFF] via-[#8B5CF6] to-[#A855F7]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel views */}
        <div className="p-6 bg-white">
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
        <div className="space-y-6 py-2 text-[#1E1B4B]">
          {qrData?.qrCode ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3.5 bg-white border border-[#E9E2FF] rounded-2xl shadow-float flex-center select-none">
                <img src={qrData.qrCode} alt="QR Code" className="w-36 h-36 object-contain" />
              </div>
              <p className="text-[9px] font-bold text-[#6B5CA5] uppercase tracking-widest mt-1">Scan to connect</p>
            </div>
          ) : (
            <div className="skeleton w-36 h-36 rounded-2xl mx-auto" />
          )}

          {/* Inline Invite by Username/Email */}
          <form onSubmit={handleInviteSubmit} className="space-y-2 bg-[#F8F5FF] border border-[#E9E2FF] p-4 rounded-2xl">
            <label className="label text-[9px] tracking-wider mb-1">Invite by Username/Email</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Enter email or username..."
                className="input py-2.5 px-3 text-xs bg-white border-[#E9E2FF] focus:border-[#6D4AFF]"
                required
              />
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="btn-primary btn text-[10px] tracking-wider font-bold py-2.5 px-4 rounded-xl shadow-glow-sm"
              >
                {addMemberMutation.isPending ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>

          {/* Copy Code */}
          <div className="space-y-2">
            <label className="label text-[9px] tracking-wider">Invite Code</label>
            <div className="flex items-center gap-2 bg-[#F8F5FF] border border-[#E9E2FF] rounded-xl px-4 py-2.5">
              <span className="text-[#6D4AFF] font-mono font-bold text-base flex-1 text-center tracking-[0.2em] uppercase select-all">
                {trip.inviteCode}
              </span>
              <button
                onClick={copyInviteLink}
                className="btn-ghost btn text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-lg border-[#E9E2FF] w-20"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social shares */}
          {qrData?.inviteUrl && (
            <div className="space-y-3">
              <label className="label text-[9px] tracking-wider">Share Directly</label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=Join%20our%20trip%20on%20TripSplit%20using%20invite%20code%20${trip.inviteCode}%20or%20click%20here%3A%20${encodeURIComponent(qrData.inviteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8F5FF] border border-[#E9E2FF] hover:border-[#6D4AFF]/20 text-[#6B5CA5] hover:text-[#6D4AFF] transition-all duration-300 gap-1.5"
                >
                  <Send size={15} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">WhatsApp</span>
                </a>
                
                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(qrData.inviteUrl)}&text=Join%20our%20trip%20on%20TripSplit%20using%20invite%20code%20${trip.inviteCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8F5FF] border border-[#E9E2FF] hover:border-[#6D4AFF]/20 text-[#6B5CA5] hover:text-[#6D4AFF] transition-all duration-300 gap-1.5"
                >
                  <Send size={15} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Telegram</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=Join%20our%20trip%20on%20TripSplit!&body=Hey!%20Join%20my%20trip%20folder%20on%20TripSplit%20using%20invite%20code%3A%20${trip.inviteCode}%20or%20click%20this%20link%3A%20${encodeURIComponent(qrData.inviteUrl)}`}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8F5FF] border border-[#E9E2FF] hover:border-[#6D4AFF]/20 text-[#6B5CA5] hover:text-[#6D4AFF] transition-all duration-300 gap-1.5"
                >
                  <Mail size={15} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Email</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function TripOverview({ trip, memberStats }) {
  const totalExpense = memberStats.reduce((s, m) => s + (m.stats?.totalPaid || 0), 0) || 1;

  return (
    <div className="space-y-8 text-[#1E1B4B]">
      {trip.description && (
        <div className="p-4 bg-[#F8F5FF] border border-[#E9E2FF] rounded-2xl">
          <p className="text-[#6B5CA5] text-xs leading-relaxed font-semibold">{trip.description}</p>
        </div>
      )}

      {/* Top contributors */}
      <div className="space-y-4">
        <div className="border-b border-[#E9E2FF] pb-2.5">
          <h3 className="text-[10px] font-bold text-[#6B5CA5] uppercase tracking-widest">Travel Contributions</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...memberStats]
            .sort((a, b) => b.stats.totalPaid - a.stats.totalPaid)
            .map((ms) => {
              const sharePct = totalExpense > 0 ? Math.min(100, (ms.stats.totalPaid / totalExpense) * 100) : 0;
              return (
                <div key={ms.user?._id} className="flex items-center justify-between p-4 bg-white border border-[#E9E2FF] rounded-2xl relative overflow-hidden group hover:border-[#D0C6FF] hover:shadow-card transition-all duration-300">
                  <div className="flex items-center gap-3 z-10">
                    <Avatar src={ms.user?.photo} name={ms.user?.fullName} size="sm" className="ring-2 ring-[#EDE8FF]" />
                    <div>
                      <p className="text-[#1E1B4B] text-xs font-bold truncate max-w-[130px]">{ms.user?.fullName}</p>
                      <p className="text-[#6B5CA5] text-[9px] mt-1 font-bold uppercase tracking-wider">Paid: ₹{formatCurrency(ms.stats.totalPaid)}</p>
                    </div>
                  </div>
                  <div className="text-right z-10">
                    <div className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#6B5CA5]">Balance</div>
                    {ms.stats.netBalance >= 0 ? (
                      <span className="text-green-600 text-xs font-bold">+₹{formatCurrency(ms.stats.toReceive)}</span>
                    ) : (
                      <span className="text-red-500 text-xs font-bold">-₹{formatCurrency(ms.stats.toPay)}</span>
                    )}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#6D4AFF] to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity"
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
