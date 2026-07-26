import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, X, ExternalLink, ChevronDown, Plane, MapPin, Package,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Train, Ticket, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { tripApi, expenseApi } from '../api';
import { GlassCard, EmptyState, Spinner, Badge, Avatar } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';

const CATEGORIES = ['', 'hotel', 'food', 'fuel', 'shopping', 'taxi', 'flights', 'train', 'entertainment', 'medical', 'other'];
const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package,
};
const CAT_COLORS = {
  hotel: 'cat-hotel', food: 'cat-food', fuel: 'cat-fuel', shopping: 'cat-shopping',
  taxi: 'cat-taxi', flights: 'cat-flights', train: 'cat-train',
  entertainment: 'cat-entertainment', medical: 'cat-medical', other: 'cat-other',
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4 text-[#1E1B4B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1B4B] tracking-tight">All Expenses</h1>
          <p className="text-[#6B5CA5] text-xs mt-1 font-medium">Track your travel splits across folders</p>
        </div>
      </div>

      {/* Filters Form */}
      <GlassCard className="!p-4 border border-[#E9E2FF] bg-white animate-fade-in" animate={false}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="input pl-9 text-xs py-2.5 bg-[#F8F5FF] border-[#E9E2FF]"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="input w-full md:w-44 text-xs py-2.5 bg-[#F8F5FF] border-[#E9E2FF] text-[#1E1B4B]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedTrip}
            onChange={e => setSelectedTrip(e.target.value)}
            className="input w-full md:w-52 text-xs py-2.5 bg-[#F8F5FF] border-[#E9E2FF] text-[#1E1B4B]"
          >
            <option value="">All Trip Folders</option>
            {trips.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          {(search || category || selectedTrip) && (
            <button
              onClick={() => { setSearch(''); setCategory(''); setSelectedTrip(''); }}
              className="btn-ghost btn text-[10px] font-bold uppercase tracking-wider gap-1.5 px-3 py-1.5 border border-[#E9E2FF] rounded-xl hover:border-[#D0C6FF] hover:bg-[#F3F0FF]"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* Grid */}
      {tripsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-[24px]" />)}
        </div>
      ) : !trips.length ? (
        <GlassCard className="border border-[#E9E2FF]">
          <EmptyState
            icon={<Receipt size={32} className="text-[#6D4AFF]" />}
            title="No expense activity"
            description="Create a trip and start writing expenses to split bills."
            action={<Link to="/trips/new" className="btn-primary btn text-xs rounded-xl py-2 shadow-glow-sm">Create Trip</Link>}
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E9E2FF] rounded-[24px] overflow-hidden hover:border-[#D0C6FF] hover:shadow-card transition-all duration-300 shadow-sm"
    >
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-[#F8F5FF] transition-all text-left bg-white"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#6D4AFF]/10 to-[#8B5CF6]/5 flex-shrink-0 border border-[#E9E2FF] flex-center">
          {trip.coverImage
            ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
            : <Plane size={16} className="text-[#6D4AFF]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#1E1B4B] text-sm truncate">{trip.name}</p>
          <div className="flex items-center gap-2 text-[#6B5CA5] text-xs mt-0.5 font-medium">
            <span>{trip.destination}</span>
            <span>•</span>
            <span>{trip.members?.length} members</span>
          </div>
        </div>
        <div className="text-right mr-2 flex-shrink-0">
          <p className="text-[#6D4AFF] font-bold text-sm">₹{formatCurrency(totalAmount)}</p>
          <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider mt-0.5">Total</p>
        </div>
        <ChevronDown
          size={16}
          className={clsx('text-[#6B5CA5] transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
        />
      </button>

      {/* Collapsible Expense items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-white border-t border-[#E9E2FF]"
          >
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
                </div>
              ) : !expenses.length ? (
                <div className="p-8 text-center text-[#6B5CA5] text-xs font-medium">
                  No matching expenses found in this trip folder.
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {expenses.map((exp, i) => (
                      <motion.div
                        key={exp._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-[#E9E2FF]/60 hover:bg-[#F8F5FF] transition-all"
                      >
                        <div className={clsx('w-9 h-9 rounded-xl flex-center flex-shrink-0 border', CAT_COLORS[exp.category] || 'cat-other')}>
                          {(() => {
                            const CatIcon = CAT_ICONS[exp.category] || Package;
                            return <CatIcon size={14} />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1E1B4B] font-bold text-xs truncate">{exp.name}</p>
                          <div className="flex items-center gap-2 text-[#6B5CA5] text-[10px] mt-1">
                            <Avatar src={exp.paidBy?.photo} name={exp.paidBy?.fullName} size="xs" />
                            <span className="font-semibold text-[#6B5CA5]">{exp.paidBy?.fullName}</span>
                            <span>•</span>
                            <span>{format(new Date(exp.date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[#1E1B4B] font-bold text-xs">₹{formatCurrency(exp.amount)}</p>
                          <Badge variant="primary" className="mt-1 text-[8px] capitalize">
                            {exp.splitType}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-between items-center border-t border-[#E9E2FF] mt-3">
                    <Link
                      to={`/trips/${trip._id}?tab=expenses`}
                      className="text-[#6D4AFF] text-xs font-bold hover:text-[#5A38E8] flex items-center gap-1"
                    >
                      <span>Manage Split</span>
                      <ExternalLink size={11} className="stroke-[2.5]" />
                    </Link>
                    <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">{expenses.length} listed</p>
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
