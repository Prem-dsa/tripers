import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, X, ExternalLink, ChevronDown, Plane, MapPin, Package,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Train, Ticket, Stethoscope, SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { tripApi, expenseApi } from '../api';
import { GlassCard, EmptyState, Badge, Avatar } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';

const CATEGORIES = ['hotel', 'food', 'fuel', 'shopping', 'taxi', 'flights', 'train', 'entertainment', 'medical', 'other'];
const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package,
};
const CAT_COLORS = {
  hotel: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  food: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  fuel: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  shopping: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  taxi: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  flights: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  train: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  entertainment: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  medical: 'bg-red-500/20 text-red-300 border-red-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

// Dark glass select / input style
const selectStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#f1f5f9',
  borderRadius: '14px',
  padding: '10px 40px 10px 16px',
  fontSize: '13px',
  fontWeight: '600',
  outline: 'none',
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '14px',
};

const optionStyle = {
  background: '#1e293b',
  color: '#f1f5f9',
};

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [expandedTrip, setExpandedTrip] = useState(null);

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const trips = tripsData?.trips || [];
  const filteredTrips = selectedTrip ? trips.filter(t => t._id === selectedTrip) : trips;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[14px] flex items-center justify-center shadow-glow flex-shrink-0">
          <Receipt size={18} className="text-white stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">All Expenses</h1>
          <p className="text-indigo-300/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Track your travel splits</p>
        </div>
      </motion.div>

      {/* Filters */}
      <GlassCard className="!p-4" animate={false}>
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '10px 16px 10px 40px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#f1f5f9',
                width: '100%',
                outline: 'none',
              }}
              className="placeholder:text-slate-500 focus:border-indigo-400/60 transition-colors"
            />
          </div>

          {/* Category + Trip row */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="" style={optionStyle}>All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} style={optionStyle}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={selectedTrip}
                onChange={e => setSelectedTrip(e.target.value)}
                style={selectStyle}
              >
                <option value="" style={optionStyle}>All Trips</option>
                {trips.map(t => (
                  <option key={t._id} value={t._id} style={optionStyle}>{t.name}</option>
                ))}
              </select>
            </div>
            {(search || category || selectedTrip) && (
              <motion.button
                onClick={() => { setSearch(''); setCategory(''); setSelectedTrip(''); }}
                className="flex items-center justify-center gap-1.5 text-[11px] font-bold px-4 py-2.5 rounded-[14px] bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 uppercase tracking-wider transition-all flex-shrink-0"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <X size={12} className="stroke-[2.5]" /> Clear
              </motion.button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Trip Expense Groups */}
      {tripsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20 rounded-[22px]" />
          ))}
        </div>
      ) : !trips.length ? (
        <EmptyState
          icon={<Receipt size={30} className="text-indigo-400" />}
          title="No trips found"
          description="Create a trip first, then add expenses to split bills."
          action={
            <Link to="/trips/new" className="btn-primary rounded-full py-2.5 px-6 text-[12px] font-bold shadow-glow">
              Create Trip
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTrips.map(trip => (
              <TripExpenseGroup
                key={trip._id}
                trip={trip}
                search={search}
                category={category}
                isExpanded={expandedTrip === trip._id}
                onToggle={() => setExpandedTrip(expandedTrip === trip._id ? null : trip._id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TripExpenseGroup({ trip, search, category, isExpanded, onToggle }) {
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', trip._id, search, category],
    queryFn: () => expenseApi.getTripExpenses(trip._id, { search, category, limit: 50 }).then(r => r.data),
    enabled: isExpanded,
  });

  const expenses = data?.expenses || [];
  const totalAmount = data?.totalAmount || trip.totalExpense || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '22px',
        overflow: 'hidden',
      }}
    >
      {/* Trip Header Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
      >
        <div
          className="w-11 h-11 rounded-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
        >
          {trip.coverImage
            ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
            : <Plane size={17} className="text-white stroke-[2.5]" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-[14px] truncate">{trip.name}</p>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5 font-medium">
            <MapPin size={10} className="text-indigo-400 stroke-[2.5]" />
            <span className="truncate">{trip.destination}</span>
            <span className="text-slate-600">•</span>
            <span>{trip.members?.length} members</span>
          </div>
        </div>

        <div className="text-right mr-2 flex-shrink-0">
          <p className="text-indigo-400 font-extrabold text-[15px]">₹{formatCurrency(totalAmount)}</p>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mt-0.5">Total</p>
        </div>

        <ChevronDown
          size={16}
          className={clsx('text-slate-500 transition-transform duration-200 flex-shrink-0', isExpanded && 'rotate-180')}
        />
      </button>

      {/* Expanded Expenses */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-[16px]" />)}
                </div>
              ) : !expenses.length ? (
                <p className="text-center text-slate-500 text-[12px] font-medium py-8">
                  No matching expenses found.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {expenses.map((exp, i) => {
                      const CatIcon = CAT_ICONS[exp.category] || Package;
                      const catColor = CAT_COLORS[exp.category] || CAT_COLORS.other;
                      return (
                        <motion.div
                          key={exp._id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-[16px] border border-white/10 hover:bg-white/8 transition-all duration-200"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <div className={clsx('w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 border', catColor)}>
                            <CatIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-[12px] truncate">{exp.name}</p>
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-0.5 font-medium">
                              <Avatar src={exp.paidBy?.photo} name={exp.paidBy?.fullName} size="xs" />
                              <span>{exp.paidBy?.fullName}</span>
                              <span className="text-slate-600">•</span>
                              <span>{format(new Date(exp.date), 'MMM d')}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-extrabold text-[13px]">₹{formatCurrency(exp.amount)}</p>
                            <Badge variant="primary" className="mt-1 text-[8px] capitalize">{exp.splitType}</Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex justify-between items-center border-t border-white/10 mt-1">
                    <Link
                      to={`/trips/${trip._id}?tab=expenses`}
                      className="text-indigo-400 text-[11px] font-bold hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                    >
                      Manage Split <ExternalLink size={10} className="stroke-[2.5]" />
                    </Link>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      {expenses.length} expenses
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
