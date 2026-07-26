import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserMinus, Shield, Plus, Mail, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { tripApi } from '../../api';
import { Avatar, Badge, EmptyState, ProgressBar } from '../ui/index';
import { ConfirmModal } from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MembersTab({ trip, memberStats, isAdmin }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [removeTarget, setRemoveTarget] = useState(null);
  const [emailOrUsername, setEmailOrUsername] = useState('');

  const addMutation = useMutation({
    mutationFn: (emailOrUsername) => tripApi.addMember(trip._id, { emailOrUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', trip._id]);
      toast.success('Traveler added successfully! 🎉');
      setEmailOrUsername('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add traveler.');
    },
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) return;
    addMutation.mutate(emailOrUsername.trim());
  };

  const removeMutation = useMutation({
    mutationFn: (userId) => tripApi.removeMember(trip._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', trip._id]);
      toast.success('Traveler removed from folder.');
      setRemoveTarget(null);
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to remove member.'),
  });

  const adminMutation = useMutation({
    mutationFn: (userId) => tripApi.assignAdmin(trip._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', trip._id]);
      toast.success('Admin privileges assigned.');
    },
  });

  const totalExpense = memberStats.reduce((s, m) => s + (m.stats?.totalPaid || 0), 0) || 1;

  return (
    <div className="space-y-6 text-[#1E1B4B]">
      {/* Invite Member Section */}
      {isAdmin && (
        <form onSubmit={handleAddMember} className="bg-white border border-[#E9E2FF] p-5 rounded-[22px] space-y-3.5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D4AFF]/5 rounded-full blur-2xl pointer-events-none" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6B5CA5]">Invite Traveler by Email or Username</h4>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter email or username..."
                className="input flex-1 pl-10 py-2.5 text-xs bg-[#F8F5FF] border-[#E9E2FF] focus:border-[#6D4AFF]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-primary btn text-[10px] tracking-wider font-bold py-2.5 px-5 rounded-xl shadow-glow-sm"
            >
              {addMutation.isPending ? 'Inviting...' : <><Plus size={12} className="stroke-[2.5]" /> Invite</>}
            </button>
          </div>
        </form>
      )}

      {/* Grid of travelers */}
      {!memberStats.length ? (
        <EmptyState icon={<Users size={32} className="text-[#6D4AFF]" />} title="No travelers" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberStats.map((ms) => {
            const memberInfo = trip.members?.find(m => m.user?._id === ms.user?._id);
            const role = memberInfo?.role || 'member';
            const isCreator = trip.createdBy?._id === ms.user?._id;
            const netBal = ms.stats?.netBalance || 0;
            const contributionPct = totalExpense > 0 ? ((ms.stats?.totalPaid || 0) / totalExpense * 100) : 0;

            const isOnline = ms.user?._id === user?._id || Math.abs(ms.user?.fullName.charCodeAt(0) || 0) % 2 === 0;

            return (
              <div key={ms.user?._id} className="bg-white border border-[#E9E2FF] p-5 rounded-[22px] flex flex-col justify-between hover:border-[#D0C6FF] hover:shadow-card transition-all duration-300 shadow-sm relative group">
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => navigate(`/members/${ms.user?._id}`)} className="flex-shrink-0 relative">
                    <Avatar
                      src={ms.user?.photo}
                      name={ms.user?.fullName}
                      size="lg"
                      className="ring-2 ring-[#EDE8FF] hover:ring-[#6D4AFF]/30 transition-all rounded-full"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-white shadow-[0_0_8px_rgba(34,197,94,0.4)]" title="Online" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => navigate(`/members/${ms.user?._id}`)}
                        className="text-[#1E1B4B] text-xs font-bold hover:text-[#6D4AFF] transition-colors truncate max-w-[130px]"
                      >
                        {ms.user?.fullName}
                      </button>
                      {isCreator && <Badge variant="primary" className="text-[7px]">Creator</Badge>}
                      {role === 'admin' && !isCreator && <Badge variant="warning" className="text-[7px]">Admin</Badge>}
                      {ms.user?._id === user?._id && <Badge variant="gray" className="text-[7px]">You</Badge>}
                    </div>
                    <p className="text-[#6B5CA5] text-[9px] font-bold uppercase tracking-wider mt-1.5">@{ms.user?.username}</p>
                    {ms.user?.phone && <p className="text-[#6B5CA5] text-[9px] mt-1">{ms.user.phone}</p>}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && ms.user?._id !== user?._id && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      {!isCreator && role !== 'admin' && (
                        <button
                          onClick={() => adminMutation.mutate(ms.user?._id)}
                          className="btn-icon w-8 h-8 rounded-lg hover:bg-[#F3F0FF] hover:border-[#E9E2FF] text-[#6B5CA5] hover:text-[#6D4AFF]"
                          title="Assign Admin"
                        >
                          <Shield size={12} />
                        </button>
                      )}
                      {!isCreator && (
                        <button
                          onClick={() => setRemoveTarget(ms.user)}
                          className="btn-icon w-8 h-8 rounded-lg hover:bg-red-50 hover:border-red-100 text-[#6B5CA5] hover:text-red-550"
                          title="Remove Member"
                        >
                          <UserMinus size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Balance statistics */}
                <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-[#F8F5FF] border border-[#E9E2FF] p-2 rounded-xl">
                    <p className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-widest">Paid</p>
                    <p className="text-[#1E1B4B] font-extrabold text-xs mt-1">₹{formatCurrency(ms.stats?.totalPaid)}</p>
                  </div>
                  <div className="bg-[#F8F5FF] border border-[#E9E2FF] p-2 rounded-xl">
                    <p className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-widest">Share</p>
                    <p className="text-[#1E1B4B] font-extrabold text-xs mt-1">₹{formatCurrency(ms.stats?.totalShare)}</p>
                  </div>
                  <div className="bg-[#F8F5FF] border border-[#E9E2FF] p-2 rounded-xl">
                    <p className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-widest">Net</p>
                    <p className={clsx('font-extrabold text-xs mt-1', netBal >= 0 ? 'text-green-600' : 'text-red-550')}>
                      {netBal >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(netBal))}
                    </p>
                  </div>
                </div>

                {/* Contribution bar */}
                {ms.stats?.totalPaid > 0 && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#E9E2FF]">
                    <div className="flex justify-between text-[8px] font-bold text-[#6B5CA5] uppercase tracking-widest mb-1.5">
                      <span>Travel share contribution</span>
                      <span>{contributionPct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={ms.stats.totalPaid} max={totalExpense} color="primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeMutation.mutate(removeTarget?._id)}
        loading={removeMutation.isPending}
        title="Remove Folder Member"
        message={`Remove ${removeTarget?.fullName} from this trip? They will lose access to all trip metrics.`}
        confirmText="Remove Member"
        danger
      />
    </div>
  );
}
