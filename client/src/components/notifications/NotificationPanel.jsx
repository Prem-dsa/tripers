import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, CheckCheck, Trash2, Banknote, Pencil, UserPlus, UserMinus, BellDot, Map, AlertTriangle, Coins, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { notificationApi } from '../../api';
import { Avatar, Spinner, EmptyState } from '../ui/index';
import { clsx } from 'clsx';

const typeIcons = {
  expense_added: Banknote, expense_edited: Pencil, expense_deleted: Trash2,
  member_joined: UserPlus, member_removed: UserMinus, payment_requested: BellDot,
  payment_confirmed: Check, payment_rejected: X, trip_updated: Map,
  budget_alert: AlertTriangle, settlement_reminder: Coins,
};

export function NotificationPanel() {
  const { notificationPanelOpen, toggleNotificationPanel } = useUIStore();
  const { markRead, markAllRead } = useNotificationStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ limit: 30 }).then((r) => r.data),
    enabled: notificationPanelOpen,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: (_, id) => { markRead(id); queryClient.invalidateQueries(['notifications']); },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => { markAllRead(); queryClient.invalidateQueries(['notifications']); },
  });

  const notifications = data?.notifications || [];

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleNotificationPanel}
          />
          <motion.div
            className="fixed right-4 top-20 w-80 sm:w-96 glass border-[#E9E2FF] shadow-float z-50 flex flex-col max-h-[80vh] bg-white text-[#1E1B4B]"
            initial={{ opacity: 0, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E9E2FF]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#6D4AFF]" />
                <h3 className="font-bold text-[#1E1B4B]">Notifications</h3>
                {data?.unreadCount > 0 && (
                  <span className="badge-primary badge text-xs">{data.unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {data?.unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="btn-ghost btn text-xs gap-1.5 hover:bg-[#F3F0FF] text-[#6B5CA5] hover:text-[#6D4AFF]"
                    title="Mark all read"
                  >
                    <CheckCheck size={13} /> All read
                  </button>
                )}
                <button onClick={toggleNotificationPanel} className="btn-icon hover:bg-[#F3F0FF] text-[#6B5CA5]">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 no-scrollbar">
              {isLoading ? (
                <div className="flex-center py-12"><Spinner /></div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={<Bell size={32} className="text-[#6D4AFF]" />} title="No notifications" description="You're all caught up!" />
              ) : (
                <div>
                  {notifications.map((n) => (
                    <motion.div
                      key={n._id}
                      layout
                      className={clsx(
                        'p-4 border-b border-[#E9E2FF]/60 flex gap-3 cursor-pointer hover:bg-[#F8F5FF] transition-all',
                        !n.read && 'bg-[#F3F0FF]/40 border-l-2 border-l-[#6D4AFF]'
                      )}
                      onClick={() => { if (!n.read) markReadMutation.mutate(n._id); }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {(() => {
                          const Icon = typeIcons[n.type] || Megaphone;
                          return <Icon size={20} className="text-[#6D4AFF]" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1E1B4B] text-sm font-bold">{n.title}</p>
                        <p className="text-[#6B5CA5] text-xs mt-1.5 leading-relaxed font-semibold">{n.message}</p>
                        <p className="text-[#6B5CA5]/60 text-[10px] mt-1.5 font-bold">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-[#6D4AFF] flex-shrink-0 mt-2" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
