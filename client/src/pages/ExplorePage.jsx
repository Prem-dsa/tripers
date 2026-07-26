import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, TrendingDown, Users, MapPin, Calendar,
  Star, Globe, Zap, Lightbulb, ScanText, Bell, Plane, Wallet,
  ArrowDownToLine, Hourglass, Link as LinkIcon, Coins, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { tripApi, userApi } from '../api';
import { GlassCard, EmptyState, Avatar, Badge } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import { useAuthStore } from '../store/authStore';

const tipCards = [
  {
    icon: Lightbulb, title: 'Split Smarter',
    tip: 'Use the percentage split when splitting bills based on consumption, like hotel rooms of different sizes.',
    gradient: 'from-[#6D4AFF] to-[#8B5CF6]',
  },
  {
    icon: ScanText, title: 'Scan Receipts',
    tip: 'Upload a receipt photo and use the AI scanner to auto-extract the amount — no manual entry needed!',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap, title: 'Quick Settle',
    tip: 'The Minimum Cash Flow algorithm reduces settlement transactions to the bare minimum.',
    gradient: 'from-green-500 to-emerald-605',
  },
  {
    icon: Bell, title: 'Budget Alerts',
    tip: 'Set a trip budget and get notified when you hit 80% and 100% — stay on track.',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

export default function ExplorePage() {
  const { user } = useAuthStore();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data),
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const stats = dashData?.stats;
  const trips = tripsData?.trips || [];
  const topTrip = trips.length ? [...trips].sort((a, b) => (b.totalExpense || 0) - (a.totalExpense || 0))[0] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-2 sm:px-4 text-[#1E1B4B]">
      {/* Hero */}
      <motion.div
        className="bg-white border border-[#E9E2FF] rounded-[24px] p-8 relative overflow-hidden shadow-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#6D4AFF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] flex-center">
              <Compass size={20} className="text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">Explore</h1>
              <p className="text-[#6B5CA5] text-sm">Your travel universe at a glance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Trips', value: (stats?.tripsCreated || 0) + (stats?.tripsJoined || 0), icon: <Plane size={16} />, loading: isLoading },
              { label: 'Total Paid', value: stats ? `₹${formatCurrency(stats.totalPaid)}` : '—', icon: <Wallet size={16} />, loading: isLoading },
              { label: 'To Receive', value: stats ? `₹${formatCurrency(stats.totalToReceive)}` : '—', icon: <ArrowDownToLine size={16} />, loading: isLoading },
              { label: 'Pending', value: stats?.pendingSettlements ?? '—', icon: <Hourglass size={16} />, loading: isLoading },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-[#F8F5FF] border border-[#E9E2FF] p-4 rounded-xl text-center shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {item.loading ? (
                  <div className="skeleton h-8 w-16 mx-auto rounded mb-2" />
                ) : (
                  <p className="text-xl font-bold text-[#1E1B4B]">{item.value}</p>
                )}
                <p className="text-[#6B5CA5] text-xs mt-1 font-semibold">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-[#1E1B4B] flex items-center gap-2">
              <Globe size={18} className="text-[#6D4AFF]" /> Your Trips
            </h2>
            <Link to="/trips" className="text-[#6D4AFF] text-xs font-bold hover:text-[#5A38E8]">View all →</Link>
          </div>

          {!trips.length ? (
            <GlassCard>
              <EmptyState
                icon={<MapPin size={32} className="text-[#6D4AFF]" />}
                title="No trips yet"
                description="Create your first trip and start your adventure!"
                action={<Link to="/trips/new" className="btn-primary btn">Create Trip</Link>}
              />
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {trips.slice(0, 5).map((trip, i) => (
                <motion.div
                  key={trip._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={`/trips/${trip._id}`}
                    className="bg-white border border-[#E9E2FF] flex items-center gap-4 p-4 rounded-[24px] hover:border-[#D0C6FF] hover:shadow-card transition-all duration-300 group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#6D4AFF]/10 to-[#8B5CF6]/5 border border-[#E9E2FF] flex-center">
                      {trip.coverImage
                        ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <Plane size={20} className="text-[#6D4AFF]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1E1B4B] truncate group-hover:text-[#6D4AFF] transition-colors">{trip.name}</p>
                      <div className="flex items-center gap-3 text-[#6B5CA5] text-xs mt-1">
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-[#6D4AFF]" /> {trip.destination}</span>
                        <span className="flex items-center gap-1"><Users size={11} className="text-[#6D4AFF]" /> {trip.members?.length}</span>
                        {trip.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-[#6D4AFF]" /> {format(new Date(trip.startDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#6D4AFF] font-bold text-sm">₹{formatCurrency(trip.totalExpense || 0)}</p>
                      <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'gray' : 'primary'} className="text-xs mt-1">
                        {trip.status}
                      </Badge>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Trip */}
          {topTrip && (
            <GlassCard className="border-[#E9E2FF] bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-amber-500" />
                <h3 className="font-bold text-[#1E1B4B] text-sm">Biggest Trip</h3>
              </div>
              <Link to={`/trips/${topTrip._id}`} className="block group">
                <div className="h-24 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-[#6D4AFF]/10 to-[#8B5CF6]/5 border border-[#E9E2FF] flex-center">
                  {topTrip.coverImage
                    ? <img src={topTrip.coverImage} alt={topTrip.name} className="w-full h-full object-cover" />
                    : <Plane size={32} className="text-[#6D4AFF]" />
                  }
                </div>
                <p className="font-bold text-[#1E1B4B] group-hover:text-[#6D4AFF] transition-colors">{topTrip.name}</p>
                <p className="text-[#6B5CA5] text-xs flex items-center gap-1 mt-1"><MapPin size={10} className="text-[#6D4AFF]" /> {topTrip.destination}</p>
                <p className="text-[#6D4AFF] font-bold mt-2">₹{formatCurrency(topTrip.totalExpense || 0)}</p>
              </Link>
            </GlassCard>
          )}

          {/* Tips */}
          <GlassCard className="border-[#E9E2FF] bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-amber-550" />
              <h3 className="font-bold text-[#1E1B4B] text-sm">Pro Tips</h3>
            </div>
            <div className="space-y-3">
              {tipCards.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 bg-[#F8F5FF] border border-[#E9E2FF] rounded-xl">
                    <span className="text-[#6D4AFF] flex-shrink-0 mt-0.5"><Icon size={18} /></span>
                    <div>
                      <p className="text-[#1E1B4B] font-semibold text-xs">{tip.title}</p>
                      <p className="text-[#6B5CA5] text-xs mt-1 leading-relaxed">{tip.tip}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="border-[#E9E2FF] bg-white">
            <h3 className="font-bold text-[#1E1B4B] text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/trips/new', label: 'New Trip', icon: <Plane size={20} className="text-white" />, color: 'from-[#6D4AFF] to-[#8B5CF6]' },
                { to: '/join', label: 'Join Trip', icon: <LinkIcon size={20} className="text-white" />, color: 'from-[#8B5CF6] to-[#A855F7]' },
                { to: '/settlements', label: 'Settle Up', icon: <Coins size={20} className="text-white" />, color: 'from-green-500 to-emerald-500' },
                { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} className="text-white" />, color: 'from-amber-500 to-orange-500' },
              ].map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#F8F5FF] border border-transparent hover:border-[#E9E2FF] transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex-center text-lg group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <p className="text-[#6B5CA5] text-xs font-bold group-hover:text-[#6D4AFF] transition-colors">{action.label}</p>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
