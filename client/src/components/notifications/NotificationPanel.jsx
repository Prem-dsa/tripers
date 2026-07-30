import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, CheckCheck, Trash2, Banknote, Pencil, UserPlus, UserMinus, BellDot, Map, AlertTriangle, Coins, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useUIStore, useNotificationStore } from '../../store/uiStore';
import { notificationApi } from '../../api';
import { Avatar, Spinner, EmptyState, Badge } from '../ui/index';
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
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleNotificationPanel}
          />
          <motion.div
            className="fixed right-4 sm:right-6 top-20 w-80 sm:w-96 bg-white/80 backdrop-blur-[40px] border border-white/60 shadow-float z-50 flex flex-col max-h-[80vh] rounded-[28px] overflow-hidden"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-white/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-primary-50 flex items-center justify-center border border-primary-100">
                  <Bell size={15} className="text-primary-500" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Notifications</h3>
                {data?.unreadCount > 0 && (
                  <Badge variant="primary" className="text-[10px]">{data.unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {data?.unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary-500 hover:text-primary-600 px-3 py-1.5 rounded-full hover:bg-primary-50 transition-colors uppercase tracking-wider"
                    title="Mark all read"
                  >
                    <CheckCheck size={13} /> All read
                  </button>
                )}
                <button onClick={toggleNotificationPanel} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 no-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Spinner /></div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={<Bell size={32} className="text-primary-500" />} title="No notifications" description="You're all caught up!" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const Icon = typeIcons[n.type] || Megaphone;
                    return (
                      <motion.div
                        key={n._id}
                        layout
                        className={clsx(
                          'p-4 flex gap-3 cursor-pointer hover:bg-white/90 transition-all duration-200',
                          !n.read && 'bg-primary-50/30'
                        )}
                        onClick={() => { if (!n.read) markReadMutation.mutate(n._id); }}
                      >
                        <div className="w-9 h-9 rounded-[12px] bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          <Icon size={16} className="text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-[13px] font-bold">{n.title}</p>
                          <p className="text-slate-500 text-[11px] mt-1 leading-relaxed font-medium">{n.message}</p>
                          <p className="text-slate-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-2 shadow-glow" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
