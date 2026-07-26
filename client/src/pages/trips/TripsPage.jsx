import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Plane, Users, Calendar, MapPin,
  MoreVertical, Edit, Trash2, Share2, Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { tripApi } from '../../api';
import { GlassCard, Badge, EmptyState, Spinner, Avatar, ProgressBar } from '../../components/ui/index';
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
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
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
      toast.success('Trip folder deleted permanently.');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete operation failed.'),
  });

  const trips = data?.trips || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">My Trips</h1>
          <p className="text-[#6B5CA5] text-xs font-bold uppercase tracking-wider mt-1.5">{data?.total || 0} Travel Folders Active</p>
        </div>
        <div className="flex gap-3">
          <Link to="/join" className="btn-secondary btn text-[10px] tracking-wider font-bold uppercase px-4 py-2.5 rounded-xl border-[#E9E2FF] hover:bg-[#F3F0FF]">
            <Share2 size={13} className="stroke-[2.5]" /> Join Folder
          </Link>
          <Link to="/trips/new" className="btn-primary btn text-[10px] tracking-wider font-bold uppercase px-4 py-2.5 rounded-xl shadow-glow-sm">
            <Plus size={13} className="stroke-[2.5]" /> Create Trip
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="!p-3 border-[#E9E2FF] bg-white" animate={false}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders..."
              className="input pl-10 text-xs py-2.5 bg-[#F8F5FF] border-[#E9E2FF] focus:border-[#6D4AFF]"
            />
          </div>
          <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'btn text-[9px] uppercase font-bold tracking-widest px-3.5 py-2.5 rounded-lg transition-all duration-300',
                  status === s
                    ? 'bg-[#F3F0FF] text-[#6D4AFF] border border-[#EDE8FF] shadow-sm'
                    : 'text-[#6B5CA5] hover:text-[#6D4AFF] hover:bg-[#F3F0FF] border border-transparent'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-[310px] rounded-[24px]" />
          ))}
        </div>
      ) : !trips.length ? (
        <GlassCard className="border-[#E9E2FF] py-20 bg-white">
          <EmptyState
            icon={<MapPin size={36} className="text-[#6D4AFF]" />}
            title="No travel folders"
            description={search ? `No trips matching "${search}"` : "Initialize your first travel folder."}
            action={
              <Link to="/trips/new" className="btn-primary btn text-xs uppercase font-bold tracking-wider py-2.5 px-6 rounded-xl shadow-glow-sm">
                Create Folder
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
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
        title="Delete Trip Folder"
        message={`Confirm deletion of "${deleteTarget?.name}"? All associated transaction entries, image cards, and settles will be deleted permanently.`}
        confirmText="Confirm Delete"
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
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
      }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white border border-[#E9E2FF] rounded-[24px] overflow-hidden hover:border-[#D0C6FF] hover:shadow-card-hover transition-all duration-500 cursor-pointer flex flex-col group shadow-card"
      onClick={() => navigate(`/trips/${trip._id}`)}
    >
      {/* Cover Image Header */}
      <div className="h-36 relative overflow-hidden bg-gradient-to-br from-[#6D4AFF]/5 to-[#8B5CF6]/5 border-b border-[#E9E2FF]">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D4AFF]/10 to-[#8B5CF6]/10 border border-[#E9E2FF] flex-center animate-float">
              <Plane size={22} className="text-[#6D4AFF]" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/30 to-transparent" />
        
        {/* Floating Status Badges */}
        <div className="absolute top-4 left-4">
          <Badge variant={statusColors[trip.status]}>{trip.status}</Badge>
        </div>

        {/* Menu Buttons */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-md text-[#1E1B4B] border border-[#E9E2FF] flex-center hover:bg-white transition-all duration-300"
          >
            <MoreVertical size={14} />
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
                  className="absolute right-0 top-9 w-32 bg-white border border-[#E9E2FF] rounded-xl z-20 overflow-hidden shadow-float"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trips/${trip._id}/edit`);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#6B5CA5] hover:bg-[#F3F0FF] hover:text-[#6D4AFF] transition-colors"
                  >
                    <Edit size={12} /> Edit Folder
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors border-t border-[#E9E2FF]"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-extrabold text-[#1E1B4B] text-base truncate group-hover:text-[#6D4AFF] transition-colors tracking-tight">
            {trip.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">
            <MapPin size={11} className="text-[#6D4AFF]" />
            <span className="truncate">{trip.destination}</span>
          </div>

          {trip.startDate && (
            <div className="flex items-center gap-2 mt-1.5 text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">
              <Calendar size={11} className="text-[#6D4AFF]" />
              <span>
                {format(new Date(trip.startDate), 'MMM d')} –{' '}
                {trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : 'Ongoing'}
              </span>
            </div>
          )}
        </div>

        {/* Budget Bar */}
        {trip.budget > 0 ? (
          <div>
            <div className="flex justify-between text-[8px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-1.5">
              <span>Budget metrics</span>
              <span className={clsx(budgetPct >= 100 ? 'text-[#EF4444]' : budgetPct >= 80 ? 'text-[#F59E0B]' : 'text-[#6D4AFF]')}>{budgetPct.toFixed(0)}%</span>
            </div>
            <ProgressBar value={trip.totalExpense} max={trip.budget} color={budgetPct >= 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'primary'} />
          </div>
        ) : (
          <div className="h-px bg-[#E9E2FF]" />
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E9E2FF]">
          {/* Overlapping member avatars */}
          <div className="flex items-center -space-x-2.5 overflow-hidden">
            {trip.members?.slice(0, 3).map((m, i) => (
              <Avatar
                key={m.user?._id || i}
                src={m.user?.photo}
                name={m.user?.fullName}
                size="xs"
                className="ring-2 ring-white"
              />
            ))}
            {trip.members?.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-[#F3F0FF] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#6D4AFF] shadow-sm">
                +{trip.members.length - 3}
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-widest">Total Spent</p>
            <p className="text-[#6D4AFF] font-extrabold text-sm mt-1">₹{formatCurrency(trip.totalExpense || 0)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
