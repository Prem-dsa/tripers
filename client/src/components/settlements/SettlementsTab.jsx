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
  const [payModal, setPayModal] = useState(null); // stores active settlement to pay
  const [screenshotPreview, setScreenshotPreview] = useState(null); // for viewing uploaded screens
  const [copiedId, setCopiedId] = useState(false);
  
  // Form fields for marking paid
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
      toast.error('Receiver has not configured a UPI ID.');
    }
  };

  const copyUPI = (upiId) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedId(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const launchUPIApp = (app) => {
    if (!payModal?.upiLink) return;
    let scheme = payModal.upiLink;
    switch(app) {
      case 'phonepe':
        scheme = payModal.upiLink.replace('upi://', 'phonepe://');
        break;
      case 'gpay':
        scheme = payModal.upiLink.replace('upi://', 'gpay://');
        break;
      case 'paytm':
        scheme = payModal.upiLink.replace('upi://', 'paytmmp://');
        break;
      case 'bhim':
        scheme = payModal.upiLink.replace('upi://', 'bhim://');
        break;
      case 'amazon':
        scheme = payModal.upiLink.replace('upi://', 'amazonpay://');
        break;
      case 'cred':
        scheme = payModal.upiLink.replace('upi://', 'credpay://');
        break;
      default:
        break;
    }
    window.location.href = scheme;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    
    setUploading(true);
    const fd = new FormData();
    if (screenshotFile) {
      fd.append('screenshot', screenshotFile);
    }
    if (upiRef) {
      fd.append('upiRef', upiRef);
    }

    markPaidMutation.mutate({ id: payModal._id, data: fd }, {
      onSettled: () => setUploading(false)
    });
  };

  const triggerWhatsappRequest = (s) => {
    const text = `Hi ${s.from?.fullName}, just a friendly reminder to settle the payment of ₹${s.amount} for our trip split. You can pay via UPI: ${s.to?.upiId || ''}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <div className="flex-center py-12"><Spinner /></div>;

  const { transactions = [], memberBalances = [], existingSettlements = [] } = data || {};
  const userId = user?._id;

  return (
    <div className="space-y-8 text-[#0F172A]">
      {/* Recommended Settlements */}
      <div>
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h3 className="text-sm font-bold text-[#0F172A]">Recommended Settlements</h3>
          <p className="text-slate-500 text-xs mt-1">Optimal transaction pathways to settle all balances</p>
        </div>

        {!transactions.length ? (
          <GlassCard className="py-16 border-slate-200 text-center bg-slate-50/40">
            <div className="text-4xl mb-3 select-none">🎉</div>
            <p className="text-green-650 font-extrabold text-sm uppercase tracking-wider">All Settle Up Completed!</p>
            <p className="text-slate-500 text-xs mt-1.5 font-semibold">No outstanding balances detected in trip metrics.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 p-5 rounded-[22px] flex flex-col justify-between hover:border-slate-350 hover:shadow-card transition-all duration-350 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={t.from?.photo} name={t.from?.fullName} size="sm" className="ring-2 ring-slate-100" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[#0F172A] text-xs font-bold truncate leading-none">{t.from?.fullName.split(' ')[0]}</p>
                      <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1.5 truncate">Owes</p>
                    </div>
                    <ArrowRight size={14} className="text-[#4F46E5] mx-1 flex-shrink-0 stroke-[2.5]" />
                    <Avatar src={t.to?.photo} name={t.to?.fullName} size="sm" className="ring-2 ring-slate-100" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[#0F172A] text-xs font-bold truncate leading-none">{t.to?.fullName.split(' ')[0]}</p>
                      <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1.5 truncate">Receives</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-1">
                    <p className="text-[#0F172A] font-extrabold text-sm">₹{formatCurrency(t.amount)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200">
                  {t.from?._id === userId && (
                    <button
                      onClick={() => createMutation.mutate({ toUserId: t.to?._id, amount: t.amount })}
                      className="btn-primary btn text-[9px] font-bold tracking-wider px-4 py-2 rounded-lg shadow-sm"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? <Spinner size="sm" /> : 'Pay Settle'}
                    </button>
                  )}
                  {t.to?.upiId && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 self-center ml-auto">
                      UPI Configured
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Member Balances */}
      <div className="pt-2">
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h3 className="text-sm font-bold text-[#0F172A]">Traveler Balances</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {memberBalances.map((mb) => (
            <div key={mb.user?._id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
              <Avatar src={mb.user?.photo} name={mb.user?.fullName} size="sm" className="ring-2 ring-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] text-xs font-bold truncate leading-none">{mb.user?.fullName}</p>
                <div className="mt-2.5 text-left">
                  {mb.stats?.netBalance >= 0 ? (
                    <p className="text-green-650 font-extrabold text-xs">+₹{formatCurrency(mb.stats.toReceive)}</p>
                  ) : (
                    <p className="text-red-650 font-extrabold text-xs">-₹{formatCurrency(mb.stats.toPay)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement History */}
      {existingSettlements.length > 0 && (
        <div className="pt-2">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h3 className="text-sm font-bold text-[#0F172A]">Settlement Records</h3>
          </div>
          <div className="space-y-3">
            {existingSettlements.map((s) => {
              const cfg = statusConfig[s.status] || statusConfig.pending;
              const isFrom = s.from?._id === userId;
              const isTo = s.to?._id === userId;
              const StatusIcon = cfg.icon;
              
              return (
                <div key={s._id} className="bg-white border border-slate-200 p-5 rounded-[22px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-350 transition-all duration-300">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar src={s.from?.photo} name={s.from?.fullName} size="xs" className="ring-1 ring-black/5" />
                    <span className="text-[#0F172A] text-xs font-bold truncate max-w-[110px]">{s.from?.fullName}</span>
                    <ArrowRight size={12} className="text-slate-500 flex-shrink-0 stroke-[2.5]" />
                    <Avatar src={s.to?.photo} name={s.to?.fullName} size="xs" className="ring-1 ring-black/5" />
                    <span className="text-[#0F172A] text-xs font-bold truncate max-w-[110px]">{s.to?.fullName}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-end flex-wrap">
                    <p className="text-[#0F172A] font-extrabold text-xs">₹{formatCurrency(s.amount)}</p>
                    
                    <div className="flex items-center gap-1.5">
                      <Badge variant={cfg.color} className="flex items-center gap-1 py-1 px-2.5">
                        <StatusIcon size={10} className="stroke-[2.5]" />
                        <span>{cfg.label}</span>
                      </Badge>
                      {s.paymentScreenshot && (
                        <button 
                          onClick={() => setScreenshotPreview(s.paymentScreenshot)}
                          className="btn-icon w-7 h-7 rounded-lg text-slate-500 hover:text-[#4F46E5] bg-slate-50 hover:bg-slate-100"
                          title="View Screenshot Receipt"
                        >
                          <Eye size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Reminders & WhatsApp Actions */}
                      {s.status === 'requested' && isTo && (
                        <button
                          onClick={() => triggerWhatsappRequest(s)}
                          className="btn-success btn text-[8px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 border-transparent"
                          title="Send reminder to WhatsApp"
                        >
                          <Send size={10} /> Reminder
                        </button>
                      )}

                      {/* Receiver Verification Actions */}
                      {s.status === 'paid' && isTo && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => confirmMutation.mutate(s._id)}
                            disabled={confirmMutation.isPending}
                            className="btn-success btn text-[8px] font-bold py-1.5 px-3 rounded-lg"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(s._id)}
                            disabled={rejectMutation.isPending}
                            className="btn-danger btn text-[8px] font-bold py-1.5 px-3 rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Payer Settle Actions */}
                      {s.status === 'requested' && isFrom && (
                        <button
                          onClick={() => openQR(s)}
                          className="btn-primary btn text-[8px] font-bold py-1.5 px-3 rounded-lg"
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
          <div className="space-y-6 py-2 text-center text-[#0F172A]">
            {payModal.qrCode ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-float flex-center select-none">
                  <img src={payModal.qrCode} alt="UPI QR Code" className="w-40 h-40 object-contain" />
                </div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>
                {!isMobileDevice() && (
                  <p className="text-[10px] text-slate-500 mt-2 max-w-[220px]">
                    Open your UPI app on your phone and scan this code to pay.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex-center mx-auto text-2xl">
                  💳
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-1">
                  <p className="text-amber-800 text-xs font-bold">{payModal.to?.fullName || 'This traveler'} hasn't added a UPI ID yet</p>
                  <p className="text-amber-750 text-[11px]">Ask them to add one under Profile → UPI Payment Details. You can still record this settlement manually below once you've paid them another way.</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-slate-500 text-xs font-semibold">Paying {payModal.to?.fullName || 'Receiver'}</p>
              <p className="text-[#4F46E5] font-extrabold text-xl mt-1.5">₹{formatCurrency(payModal.amount)}</p>
            </div>

            {payModal.to?.upiId && (
              <div className="space-y-2 text-left">
                <label className="label text-[9px] tracking-wider mb-1">Recipient UPI ID</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <span className="text-[#0F172A] font-mono text-xs flex-1 truncate">{payModal.to.upiId}</span>
                  <button
                    onClick={() => copyUPI(payModal.to.upiId)}
                    className="btn-ghost btn text-[9px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-lg border-slate-200 w-20 flex-shrink-0"
                  >
                    {copiedId ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Launch App Buttons — mobile only */}
            {payModal.upiLink && isMobileDevice() && (
              <div className="space-y-3">
                <label className="label text-xs text-left">Open UPI App to Pay</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => launchUPIApp('gpay')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    Google Pay
                  </button>
                  <button 
                    onClick={() => launchUPIApp('phonepe')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    PhonePe
                  </button>
                  <button 
                    onClick={() => launchUPIApp('paytm')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    Paytm
                  </button>
                  <button 
                    onClick={() => launchUPIApp('bhim')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    BHIM
                  </button>
                  <button 
                    onClick={() => launchUPIApp('amazon')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    Amazon Pay
                  </button>
                  <button 
                    onClick={() => launchUPIApp('cred')} 
                    className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-[#4F46E5] text-xs font-bold text-[#0F172A] transition-colors duration-305 hover:bg-slate-50"
                  >
                    Cred UPI
                  </button>
                </div>
              </div>
            )}

            {/* Screenshot upload form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 border-t border-slate-200 text-left">
              <div>
                <label className="label text-[9px] tracking-wider">Transaction ID / UPI Reference (Optional)</label>
                <input 
                  type="text" 
                  value={upiRef} 
                  onChange={e => setUpiRef(e.target.value)} 
                  placeholder="e.g. 302910481239" 
                  className="input bg-white border-slate-200" 
                />
              </div>

              <div>
                <label className="label text-[9px] tracking-wider">Upload Payment Screenshot Receipt</label>
                <div className="relative border border-dashed border-slate-200 hover:border-[#4F46E5] rounded-xl p-5 text-center cursor-pointer transition-colors duration-300 bg-slate-50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={20} className="text-slate-500" />
                    <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-wider">
                      {screenshotFile ? screenshotFile.name : 'Select or drop image'}
                    </p>
                    <p className="text-slate-500/60 text-[8px] font-bold uppercase tracking-wider">JPEG, PNG formats up to 5MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || markPaidMutation.isPending}
                className="btn-primary btn w-full gap-2 py-3 mt-2 text-[10px] tracking-wider font-bold uppercase shadow-glow-sm"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Uploading receipt...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} className="stroke-[2.5]" />
                    <span>Submit Payment Claim</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* Lightbox Screenshot Modal */}
      <Modal isOpen={!!screenshotPreview} onClose={() => setScreenshotPreview(null)} title="Payment Receipt Verification" size="sm">
        {screenshotPreview && (
          <div className="text-center space-y-4 text-[#0F172A]">
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex-center">
              <img src={screenshotPreview} alt="Payment Receipt" className="max-h-[400px] object-contain" />
            </div>
            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">
              Please double check the transaction amount and date against your bank statements before confirming.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
