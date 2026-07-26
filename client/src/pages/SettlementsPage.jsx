import { useQuery } from '@tanstack/react-query';
import { settlementApi, tripApi } from '../api';
import { GlassCard, EmptyState, Avatar, Spinner } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import { ArrowRight, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export default function SettlementsPage() {
  const { user } = useAuthStore();

  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-2 sm:px-4 text-[#1E1B4B]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#F3F0FF] rounded-xl flex-center border border-[#E9E2FF]">
          <Wallet size={16} className="text-[#6D4AFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1B4B] tracking-tight">Settlements</h1>
          <p className="text-[#6B5CA5] text-xs font-medium mt-0.5">Manage payments across all your trips</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-center py-12"><Spinner /></div>
      ) : !tripsData?.trips?.length ? (
        <GlassCard>
          <EmptyState
            icon={<Wallet size={32} className="text-[#6D4AFF]" />}
            title="No trips yet"
            description="Join or create a trip to manage settlements"
            action={<Link to="/trips/new" className="btn-primary btn mt-2 shadow-glow-sm">Create Trip</Link>}
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {tripsData.trips.map(trip => (
            <TripSettlementCard key={trip._id} trip={trip} userId={user?._id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TripSettlementCard({ trip, userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['settlements', trip._id],
    queryFn: () => settlementApi.getTripSettlements(trip._id).then(r => r.data),
  });

  const myTransactions = (data?.transactions || []).filter(
    t => t.from?._id === userId || t.to?._id === userId
  );

  if (!myTransactions.length && !isLoading) return null;

  return (
    <GlassCard className="!p-0 border-[#E9E2FF] bg-white overflow-hidden shadow-sm hover:shadow-card transition-all duration-300">
      <div className="flex items-center justify-between p-5 border-b border-[#E9E2FF]">
        <h3 className="font-bold text-[#1E1B4B] text-sm">{trip.name}</h3>
        <Link to={`/trips/${trip._id}?tab=settlements`} className="text-[#6D4AFF] text-xs font-bold hover:text-[#5A38E8] flex items-center gap-1 transition-colors">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="p-4 bg-white">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {myTransactions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#F8F5FF] border border-[#E9E2FF] rounded-xl shadow-sm">
                <Avatar src={t.from?.photo} name={t.from?.fullName} size="xs" className="ring-1 ring-black/5" />
                <p className="text-[#1E1B4B] text-xs font-bold truncate">{t.from?.fullName}</p>
                <ArrowRight size={12} className="text-[#6B5CA5] flex-shrink-0" />
                <Avatar src={t.to?.photo} name={t.to?.fullName} size="xs" className="ring-1 ring-black/5" />
                <p className="text-[#1E1B4B] text-xs font-bold flex-1 truncate">{t.to?.fullName}</p>
                <p className={clsx('font-extrabold text-sm flex-shrink-0', t.from?._id === userId ? 'text-red-500' : 'text-green-600')}>
                  {t.from?._id === userId ? '-' : '+'}₹{formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
