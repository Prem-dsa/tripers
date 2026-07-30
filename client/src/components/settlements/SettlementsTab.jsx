import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, QrCode, CreditCard, Check, X, Clock, CheckCircle, 
  AlertCircle, Copy, Send, Upload, Eye, RefreshCw, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { settlementApi } from '../../api';
import { Avatar, Badge, EmptyState, Spinner, GlassCard } from '../ui/index';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'gray', icon: Clock, label: 'Pending' },
  requested: { color: 'warning', icon: AlertCircle, label: 'Payment Requested' },
  paid: { color: 'primary', icon: Clock, label: 'Pending Verification' },
  confirmed: { color: 'success', icon: CheckCircle, label: 'Verified & Completed' },
  rejected: { color: 'danger', icon: X, label: 'Verification Failed' },
};

export default function SettlementsTab({ tripId }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [payModal, setPayModal] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [upiRef, setUpiRef] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settlements', tripId],
    queryFn: () => settlementApi.getTripSettlements(tripId).then(r => r.data),
    refetchInterval: 15000,
  });

  const requestMutation = useMutation({
    mutationFn: settlementApi.request,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['settlements', tripId]);
      toast.success('Payment request sent! 🔔');
      setPayModal({
        _id: res.data._id,
        amount: res.data.amount,
        to: res.data.to,
        upiLink: res.data.upiLink,
        qrCode: res.data.qrCode,
      });
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to send request.'),
  });

  const confirmMutation = useMutation({
    mutationFn: settlementApi.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries(['settlements', tripId]);
      toast.success('Payment verified and confirmed! ✅');
    },
    onError: err => toast.error(err.response?.data?.message || 'Confirmation failed.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => settlementApi.reject(id, 'Verification failed.'),
    onSuccess: () => {
      queryClient.invalidateQueries(['settlements', tripId]);
      toast.success('Payment verification rejected.');
    },
    onError: () => toast.error('Rejection failed.'),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, data }) => settlementApi.markPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settlements', tripId]);
      toast.success('Marked as paid! Awaiting receiver verification. ⏳');
      setPayModal(null);
      setScreenshotFile(null);
      setUpiRef('');
    },
    onError: err => toast.error(err.response?.data?.message || 'Submission failed.'),
  });

  const createMutation = useMutation({
    mutationFn: ({ toUserId, amount }) => settlementApi.create({ tripId, toUserId, amount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['settlements', tripId]);
      toast.success('Settlement record initialized!');
      if (res.data.settlement) {
        openQR(res.data.settlement);
      }
    },
  });

  const openQR = async (settlement) => {
    try {
      const res = await settlementApi.getQR(settlement._id);
      setPayModal({
        _id: settlement._id,
        amount: settlement.amount,
        to: settlement.to,
        upiLink: res.data.upiLink,
        qrCode: res.data.qrCode,
      });
    } catch {
      setPayModal({
        _id: settlement._id,
        amount: settlement.amount,
        to: settlement.to,
      });
    }
  };

  const handleDeepLink = (app) => {
    if (!payModal?.upiLink) return;
    let scheme = payModal.upiLink;
    if (app === 'gpay') scheme = payModal.upiLink.replace('upi://pay', 'gpay://upi/pay');
    if (app === 'phonepe') scheme = payModal.upiLink.replace('upi://pay', 'phonepe://pay');
    if (app === 'paytm') scheme = payModal.upiLink.replace('upi://pay', 'paytmmp://pay');
    window.location.href = scheme;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setScreenshotFile(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    
    setUploading(true);
    const fd = new FormData();
    if (screenshotFile) fd.append('screenshot', screenshotFile);
    if (upiRef) fd.append('upiRef', upiRef);

    markPaidMutation.mutate({ id: payModal._id, data: fd }, {
      onSettled: () => setUploading(false)
    });
  };

  const triggerWhatsappRequest = (s) => {
    const text = `Hi ${s.from?.fullName}, just a friendly reminder to settle the payment of ₹${s.amount} for our trip split. You can pay via UPI: ${s.to?.upiId || ''}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  const { transactions = [], memberBalances = [], existingSettlements = [] } = data || {};
  const userId = user?._id;

  return (
    <div className="space-y-6 text-white">
      {/* Recommended Settlements */}
      <div>
        <div className="border-b border-white/10 pb-2.5 mb-4">
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Recommended Settlements</h3>
          <p className="text-slate-400 text-xs font-medium mt-0.5">Optimal transaction pathways to settle all balances</p>
        </div>

        {!transactions.length ? (
          <GlassCard className="!py-10 text-center" animate={false}>
            <div className="text-3xl mb-2 select-none">🎉</div>
            <p className="text-emerald-400 font-extrabold text-sm uppercase tracking-wider">All Settle Up Completed!</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">No outstanding balances detected in trip metrics.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {transactions.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4 sm:p-5 flex flex-col justify-between hover:border-white/35 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={t.from?.photo} name={t.from?.fullName} size="sm" className="ring-2 ring-white/30 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[12px] font-bold truncate leading-tight">{t.from?.fullName?.split(' ')[0]}</p>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate">Owes</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                      <ArrowRight size={13} className="text-indigo-400 stroke-[2.5]" />
                    </div>
                    <Avatar src={t.to?.photo} name={t.to?.fullName} size="sm" className="ring-2 ring-white/30 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[12px] font-bold truncate leading-tight">{t.to?.fullName?.split(' ')[0]}</p>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate">Receives</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-1">
                    <p className="text-white font-extrabold text-sm">₹{formatCurrency(t.amount)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10 items-center justify-between">
                  {t.from?._id === userId && (
                    <motion.button
                      onClick={() => createMutation.mutate({ toUserId: t.to?._id, amount: t.amount })}
                      className="btn-primary rounded-full text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 shadow-glow min-h-[44px]"
                      disabled={createMutation.isPending}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {createMutation.isPending ? <Spinner size="sm" className="border-white" /> : 'Pay Settle'}
                    </motion.button>
                  )}
                  {t.to?.upiId && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 ml-auto">
                      UPI Ready
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Member Balances */}
      <div>
        <div className="border-b border-white/10 pb-2.5 mb-4">
          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Traveler Balances</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {memberBalances.map((mb) => (
            <div key={mb.user?._id} className="glass p-3 sm:p-4 flex items-center gap-2.5 shadow-sm">
              <Avatar src={mb.user?.photo} name={mb.user?.fullName} size="sm" className="ring-2 ring-white/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-bold truncate leading-tight">{mb.user?.fullName}</p>
                <div className="mt-1 text-left">
                  {mb.stats?.netBalance >= 0 ? (
                    <p className="text-emerald-400 font-extrabold text-[12px]">+₹{formatCurrency(mb.stats.toReceive)}</p>
                  ) : (
                    <p className="text-rose-400 font-extrabold text-[12px]">-₹{formatCurrency(mb.stats.toPay)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Records History */}
      {existingSettlements.length > 0 && (
        <div>
          <div className="border-b border-white/10 pb-2.5 mb-4">
            <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Settlement Records</h3>
          </div>
          <div className="space-y-2.5">
            {existingSettlements.map((s) => {
              const cfg = statusConfig[s.status] || statusConfig.pending;
              const isFrom = s.from?._id === userId;
              const isTo = s.to?._id === userId;
              const StatusIcon = cfg.icon;
              
              return (
                <div key={s._id} className="glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar src={s.from?.photo} name={s.from?.fullName} size="xs" />
                    <span className="text-white text-[12px] font-bold truncate max-w-[100px]">{s.from?.fullName}</span>
                    <ArrowRight size={12} className="text-slate-400 flex-shrink-0 stroke-[2.5]" />
                    <Avatar src={s.to?.photo} name={s.to?.fullName} size="xs" />
                    <span className="text-white text-[12px] font-bold truncate max-w-[100px]">{s.to?.fullName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
                    <p className="text-white font-extrabold text-sm">₹{formatCurrency(s.amount)}</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.color} className="flex items-center gap-1 py-1 px-2.5 text-[9px]">
                        <StatusIcon size={10} className="stroke-[2.5]" />
                        <span>{cfg.label}</span>
                      </Badge>
                      {s.paymentScreenshot && (
                        <button 
                          onClick={() => setScreenshotPreview(s.paymentScreenshot)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                          title="View Screenshot Receipt"
                        >
                          <Eye size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {s.status === 'requested' && isTo && (
                        <button
                          onClick={() => triggerWhatsappRequest(s)}
                          className="btn-success rounded-full text-[10px] font-bold py-1.5 px-3 flex items-center gap-1 min-h-[36px]"
                        >
                          <Send size={10} /> Reminder
                        </button>
                      )}

                      {s.status === 'paid' && isTo && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => confirmMutation.mutate(s._id)}
                            disabled={confirmMutation.isPending}
                            className="btn-success rounded-full text-[10px] font-bold py-1.5 px-3 min-h-[36px]"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(s._id)}
                            disabled={rejectMutation.isPending}
                            className="btn-danger rounded-full text-[10px] font-bold py-1.5 px-3 min-h-[36px]"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {s.status === 'requested' && isFrom && (
                        <button
                          onClick={() => openQR(s)}
                          className="btn-primary rounded-full text-[10px] font-bold py-1.5 px-3 shadow-glow min-h-[36px]"
                        >
                          Pay UPI
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment checkout modal */}
      <Modal isOpen={!!payModal} onClose={() => { setPayModal(null); setScreenshotFile(null); setUpiRef(''); }} title="UPI Settlement Checkout" size="sm">
        {payModal && (
          <div className="space-y-5 py-2 text-center text-white">
            {payModal.qrCode ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white border border-white/80 rounded-[22px] shadow-lg flex items-center justify-center select-none">
                  <img src={payModal.qrCode} alt="UPI QR Code" className="w-40 h-40 object-contain" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-[18px] flex items-center justify-center mx-auto text-2xl">
                  💳
                </div>
                <p className="text-xs text-slate-400">Direct UPI links or Manual reference pay</p>
              </div>
            )}

            <div className="p-3 rounded-[18px] bg-white/8 border border-white/15">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount to Pay</p>
              <p className="text-2xl font-black text-white tracking-tight mt-0.5">₹{formatCurrency(payModal.amount)}</p>
              <p className="text-xs text-indigo-300 font-semibold mt-1">To: {payModal.to?.fullName}</p>
            </div>

            {/* Quick UPI App Launchers */}
            {payModal.upiLink && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDeepLink('gpay')}
                  className="p-2.5 rounded-[14px] bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold transition-all"
                >
                  Google Pay
                </button>
                <button
                  onClick={() => handleDeepLink('phonepe')}
                  className="p-2.5 rounded-[14px] bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold transition-all"
                >
                  PhonePe
                </button>
                <button
                  onClick={() => handleDeepLink('paytm')}
                  className="p-2.5 rounded-[14px] bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold transition-all"
                >
                  Paytm
                </button>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3 pt-2 border-t border-white/10 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">UPI Ref / UTR No (Optional)</label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={e => setUpiRef(e.target.value)}
                  placeholder="12-digit UTR No..."
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#f1f5f9',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Upload Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || markPaidMutation.isPending}
                className="w-full btn-primary py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-glow min-h-[48px] mt-2"
              >
                {uploading || markPaidMutation.isPending ? 'Submitting Verification...' : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* Screenshot Preview Modal */}
      <Modal isOpen={!!screenshotPreview} onClose={() => setScreenshotPreview(null)} title="Payment Proof Screenshot" size="md">
        {screenshotPreview && (
          <div className="p-2 text-center">
            <img src={screenshotPreview} alt="Proof Screenshot" className="max-h-[70vh] w-auto mx-auto rounded-[18px] border border-white/20 shadow-2xl object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
