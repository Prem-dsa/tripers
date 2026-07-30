import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Plane, Users, Calendar, MapPin,
  MoreVertical, Edit, Trash2, Share2, Globe, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { tripApi } from '../../api';
import { GlassCard, Badge, EmptyState, Avatar, ProgressBar, TiltCard } from '../../components/ui/index';
import { formatCurrency } from '../../utils/currency';
import { ConfirmModal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const statusOptions = ['all', 'planning', 'active', 'completed', 'cancelled'];
const statusColors = {
  planning: 'primary',
  active: 'success',
  completed: 'gray',
  cancelled: 'danger'
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function TripsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trips', search, status],
    queryFn: () => tripApi.getAll({ search, status: status === 'all' ? '' : status }).then((r) => r.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: tripApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      toast.success('Trip deleted.');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const trips = data?.trips || [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-[40px] font-extrabold text-white tracking-tight leading-none">Explore Trips</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em] mt-3">
            {data?.total || 0} Travel Folders Available
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/join"
            className="flex-1 sm:flex-none btn-secondary rounded-full px-5 py-2.5 text-[12px] justify-center"
          >
            <Share2 size={16} className="stroke-2" />
            <span className="font-bold">Join Trip</span>
          </Link>
          <Link
            to="/trips/new"
            className="flex-1 sm:flex-none btn-primary rounded-full px-5 py-2.5 text-[12px] shadow-glow justify-center"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span className="font-bold">New Trip</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="!p-4 bg-white/10 backdrop-blur-[24px] border-white/20 shadow-sm" animate={false}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-400 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations or folders..."
              className="w-full glass-sm bg-white/10 border-white/20 focus:border-white/40 focus:bg-white/15 pl-12 pr-4 py-3.5 text-[15px] font-medium text-white placeholder:text-slate-400 rounded-[20px] transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1 px-1">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'text-[11px] uppercase font-bold tracking-[0.1em] px-5 py-3 rounded-xl transition-all duration-300 flex-shrink-0',
                  status === s
                    ? 'bg-primary/20 text-primary-300 shadow-sm ring-1 ring-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Trip Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-[320px] rounded-[28px]" />
          ))}
        </div>
      ) : !trips.length ? (
        <EmptyState
          icon={<Globe size={36} className="text-indigo-400" />}
          title="No trips yet"
          description={search ? `No trips matching "${search}"` : 'Create your first trip to get started.'}
          action={
            <Link to="/trips/new" className="btn-primary rounded-full px-7 py-3 shadow-glow text-[12px] font-bold">
              Create Trip
            </Link>
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {trips.map((trip, i) => (
              <TripCard
                key={trip._id}
                trip={trip}
                index={i}
                onDelete={() => setDeleteTarget(trip)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        loading={deleteMutation.isPending}
        title="Delete Trip"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

function TripCard({ trip, index, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const budgetPct = trip.budget > 0 ? Math.min(100, (trip.totalExpense / trip.budget) * 100) : 0;

  return (
    <TiltCard className="h-full" maxTilt={4}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong bg-white/10 backdrop-blur-[30px] rounded-[32px] overflow-hidden hover:bg-white/15 shadow-sm hover:shadow-float transition-all duration-500 cursor-pointer flex flex-col group h-full"
        onClick={() => navigate(`/trips/${trip._id}`)}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {/* Cover Image */}
        <div className="h-40 sm:h-44 relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center">
                <Plane size={28} className="text-indigo-300 stroke-[1.5]" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-5 left-5">
            <Badge variant={statusColors[trip.status]} className="shadow-sm backdrop-blur-md bg-white/10 text-white">
              {trip.status}
            </Badge>
          </div>

          {/* Menu Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-10 h-10 rounded-[14px] glass-sm bg-white/10 backdrop-blur-md text-slate-200 hover:text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center shadow-sm border border-white/10"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-40 glass-strong bg-slate-900/95 rounded-[16px] z-20 overflow-hidden shadow-lg border-white/20 p-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/trips/${trip._id}/edit`);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                    >
                      <Edit size={14} /> Edit Folder
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6 relative z-10">
          <div>
            <h3 className="font-extrabold text-white text-xl tracking-tight leading-tight group-hover:text-primary-400 transition-colors line-clamp-2">
              {trip.name}
            </h3>
            
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <MapPin size={14} className="text-primary-400 stroke-[2.5]" />
                <span className="truncate">{trip.destination}</span>
              </div>

              {trip.startDate && (
                <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <Calendar size={14} className="text-secondary-400 stroke-[2.5]" />
                  <span>
                    {format(new Date(trip.startDate), 'MMM d')}
                    {trip.endDate ? ` – ${format(new Date(trip.endDate), 'MMM d, yyyy')}` : ' – Ongoing'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Budget Bar */}
          {trip.budget > 0 ? (
            <div className="bg-white/5 p-4 rounded-[20px] border border-white/10">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Budget metrics</span>
                <span className={clsx(budgetPct >= 100 ? 'text-rose-400' : budgetPct >= 80 ? 'text-amber-400' : 'text-primary-400')}>{budgetPct.toFixed(0)}%</span>
              </div>
              <ProgressBar value={trip.totalExpense} max={trip.budget} color={budgetPct >= 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'primary'} />
            </div>
          ) : (
            <div className="h-px bg-white/10" />
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between pt-2">
            {/* Overlapping member avatars */}
            <div className="flex items-center -space-x-3 overflow-hidden p-1">
              {trip.members?.slice(0, 3).map((m, i) => (
                <Avatar
                  key={m.user?._id || i}
                  src={m.user?.photo}
                  name={m.user?.fullName}
                  size="sm"
                  className="ring-[3px] ring-slate-900 shadow-sm"
                />
              ))}
              {trip.members?.length > 3 && (
                <div className="w-8 h-8 rounded-full glass-sm border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm z-10">
                  +{trip.members.length - 3}
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em]">Total Spent</p>
              <p className="text-white font-extrabold text-lg mt-0.5 tracking-tight">₹{formatCurrency(trip.totalExpense || 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}
