import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserMinus, Shield, Plus, Mail, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { tripApi } from '../../api';
import { Avatar, Badge, EmptyState, ProgressBar } from '../ui/index';
import { ConfirmModal } from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import toast from 'react-hot-toast';

const inputClass = 'w-full bg-white/50 border border-white/80 focus:border-primary-300 focus:bg-white/90 px-5 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[16px] transition-all shadow-sm outline-none';

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
    <div className="space-y-6">
      {/* Invite Member Section */}
      {isAdmin && (
        <form onSubmit={handleAddMember} className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Invite Traveler by Email or Username</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter email or username..."
                className={`${inputClass} pl-12`}
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-primary rounded-full py-3.5 px-7 text-[12px] uppercase font-bold tracking-widest shadow-glow flex items-center justify-center gap-2 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {addMutation.isPending ? 'Inviting...' : <><Plus size={14} className="stroke-[2.5]" /> Invite</>}
            </motion.button>
          </div>
        </form>
      )}

      {/* Grid of travelers */}
      {!memberStats.length ? (
        <EmptyState icon={<Users size={32} className="text-primary-500" />} title="No travelers" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberStats.map((ms) => {
            const memberInfo = trip.members?.find(m => (m.user?._id || m.user) === ms.user?._id);
            const role = memberInfo?.role || 'member';
            const isCreator = trip.createdBy?._id === ms.user?._id;
            const netBal = ms.stats?.netBalance || 0;
            const contributionPct = totalExpense > 0 ? ((ms.stats?.totalPaid || 0) / totalExpense * 100) : 0;
            const isOnline = ms.user?._id === user?._id || Math.abs(ms.user?.fullName.charCodeAt(0) || 0) % 2 === 0;

            return (
              <motion.div
                key={ms.user?._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 backdrop-blur-[30px] border border-white/60 p-6 rounded-[28px] flex flex-col justify-between hover:shadow-float hover:bg-white transition-all duration-300 shadow-sm relative group"
              >
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => navigate(`/members/${ms.user?._id}`)} className="flex-shrink-0 relative">
                    <Avatar
                      src={ms.user?.photo}
                      name={ms.user?.fullName}
                      size="lg"
                      className="ring-2 ring-white/80 hover:ring-primary-300 transition-all"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-white shadow-glow" title="Online" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => navigate(`/members/${ms.user?._id}`)}
                        className="text-slate-800 text-[13px] font-bold hover:text-primary-500 transition-colors truncate max-w-[130px]"
                      >
                        {ms.user?.fullName}
                      </button>
                      {isCreator && <Badge variant="primary" className="text-[8px]">Creator</Badge>}
                      {role === 'admin' && !isCreator && <Badge variant="warning" className="text-[8px]">Admin</Badge>}
                      {ms.user?._id === user?._id && <Badge variant="gray" className="text-[8px]">You</Badge>}
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">@{ms.user?.username}</p>
                    {ms.user?.phone && <p className="text-slate-400 text-[10px] mt-1 font-medium">{ms.user.phone}</p>}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && ms.user?._id !== user?._id && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      {!isCreator && role !== 'admin' && (
                        <button
                          onClick={() => adminMutation.mutate(ms.user?._id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary-50 text-slate-400 hover:text-primary-500 transition-colors"
                          title="Assign Admin"
                        >
                          <Shield size={14} />
                        </button>
                      )}
                      {!isCreator && (
                        <button
                          onClick={() => setRemoveTarget(ms.user)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-danger/10 text-slate-400 hover:text-danger transition-colors"
                          title="Remove Member"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Balance statistics */}
                <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-white/60 border border-white/80 p-2.5 rounded-[16px]">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Paid</p>
                    <p className="text-slate-800 font-extrabold text-xs mt-1">₹{formatCurrency(ms.stats?.totalPaid)}</p>
                  </div>
                  <div className="bg-white/60 border border-white/80 p-2.5 rounded-[16px]">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Share</p>
                    <p className="text-slate-800 font-extrabold text-xs mt-1">₹{formatCurrency(ms.stats?.totalShare)}</p>
                  </div>
                  <div className="bg-white/60 border border-white/80 p-2.5 rounded-[16px]">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Net</p>
                    <p className={clsx('font-extrabold text-xs mt-1', netBal >= 0 ? 'text-success' : 'text-danger')}>
                      {netBal >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(netBal))}
                    </p>
                  </div>
                </div>

                {/* Contribution bar */}
                {ms.stats?.totalPaid > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200/60">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>Travel share</span>
                      <span>{contributionPct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={ms.stats.totalPaid} max={totalExpense} color="primary" />
                  </div>
                )}
              </motion.div>
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
