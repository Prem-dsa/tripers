import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, X, Scan, AlertCircle, Check, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { expenseApi, tripApi } from '../../api';
import { Modal } from '../ui/Modal';
import { Avatar, Spinner } from '../ui/index';
import { CURRENCIES } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const CATEGORIES = ['hotel','food','fuel','shopping','taxi','flights','train','entertainment','medical','other'];
const CAT_ICONS = { hotel:'🏨', food:'🍽️', fuel:'⛽', shopping:'🛍️', taxi:'🚗', flights:'✈️', train:'🚂', entertainment:'🎭', medical:'🏥', other:'📦' };

const schema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  description: z.string().optional(),
  amount: z.number({ invalid_type_error: 'Amount required' }).positive('Must be positive'),
  category: z.string().min(1),
  paidBy: z.string().min(1, 'Select payer'),
  splitType: z.enum(['equal', 'percentage', 'custom']),
  date: z.string().min(1),
  notes: z.string().optional(),
  currency: z.string().optional(),
});

const inputClass = 'w-full bg-white/10 border border-white/20 focus:border-indigo-400 focus:bg-white/15 px-5 py-3.5 text-[14px] font-medium text-white placeholder:text-slate-400 rounded-[18px] transition-all shadow-inner outline-none backdrop-blur-md';

export default function AddExpenseModal({ isOpen, onClose, tripId, expense, onSuccess }) {
  const { user } = useAuthStore();
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customSplits, setCustomSplits] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [isScanning, setIsScanning] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const fileRef = useRef();
  const isEdit = !!expense;

  const { data: tripData } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripApi.getOne(tripId).then(r => r.data),
    enabled: isOpen,
  });

  const trip = tripData?.trip;
  const members = trip?.members || [];

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      splitType: 'equal',
      category: 'other',
      paidBy: user?._id,
      currency: 'INR',
    },
  });

  const watchedSplitType = watch('splitType');
  const watchedAmount = watch('amount');
  const watchedPaidBy = watch('paidBy');

  useEffect(() => {
    if (expense) {
      reset({
        name: expense.name,
        description: expense.description || '',
        amount: expense.amount,
        category: expense.category,
        paidBy: expense.paidBy?._id || expense.paidBy,
        splitType: expense.splitType,
        date: new Date(expense.date).toISOString().split('T')[0],
        notes: expense.notes || '',
        currency: expense.currency || 'INR',
      });
      setSplitType(expense.splitType);
      const memberIds = expense.splits?.map(s => s.user?._id || s.user) || [];
      setSelectedMembers(memberIds);
      setCustomSplits(expense.splits?.map(s => ({ user: s.user?._id || s.user, amount: s.amount, percentage: s.percentage })) || []);
      if (expense.receipt) setReceiptPreview(expense.receipt);
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        splitType: 'equal',
        category: 'other',
        paidBy: user?._id,
        currency: 'INR',
      });
      setSplitType('equal');
      setSelectedMembers(members.map(m => m.user?._id || m.user));
      setCustomSplits([]);
      setReceiptPreview(null);
      setReceipt(null);
    }
  }, [expense, isOpen, members.length]);

  useEffect(() => {
    if (!isEdit && members.length) {
      setSelectedMembers(members.map(m => m.user?._id || m.user));
    }
  }, [members.length, isOpen]);

  useEffect(() => {
    if (watchedSplitType) setSplitType(watchedSplitType);
  }, [watchedSplitType]);

  const equalShare = selectedMembers.length > 0 && watchedAmount
    ? (parseFloat(watchedAmount) / selectedMembers.length).toFixed(2)
    : 0;

  const totalCustom = customSplits.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const totalPct = customSplits.reduce((s, c) => s + (parseFloat(c.percentage) || 0), 0);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        tripId,
        ...data,
        members: selectedMembers,
        customSplits,
      };

      try {
        let res;
        if (isEdit) {
          res = await expenseApi.update(expense._id, payload);
        } else {
          res = await expenseApi.add(payload);
        }

        if (receipt) {
          const fd = new FormData();
          fd.append('receipt', receipt);
          await expenseApi.uploadReceipt(res.data.expense._id, fd);
        }

        return res.data;
      } catch (err) {
        if (err.response?.status === 409) {
          setDuplicateWarning(err.response.data.message);
          throw err;
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Expense updated!' : 'Expense added!');
      onSuccess?.();
      onClose();
      setDuplicateWarning(null);
    },
    onError: (err) => {
      if (err.response?.status !== 409) {
        toast.error(err.response?.data?.message || 'Failed to save expense');
      }
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleOCR = async () => {
    if (!receipt && !receiptPreview) { toast.error('Upload a receipt first'); return; }
    setIsScanning(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(receipt || receiptPreview);
      await worker.terminate();

      const amountMatch = text.match(/(?:total|amount|₹|rs\.?|inr)\s*:?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        setValue('amount', amount);
        toast.success(`Detected amount: ₹${amount}`);
      } else {
        toast.info('Could not detect amount. Please enter manually.');
      }

      const lines = text.split('\n').filter(l => l.trim().length > 3);
      if (lines[0] && !watch('name')) {
        setValue('name', lines[0].trim().slice(0, 100));
      }
    } catch (err) {
      toast.error('OCR failed. Please enter manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const updateCustomSplit = (userId, field, value) => {
    setCustomSplits(prev => {
      const existing = prev.find(s => s.user === userId);
      if (existing) return prev.map(s => s.user === userId ? { ...s, [field]: value } : s);
      return [...prev, { user: userId, amount: 0, percentage: 0, [field]: value }];
    });
  };

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-[20px]">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-semibold">{duplicateWarning}</p>
              <button type="button" onClick={() => { setDuplicateWarning(null); mutation.mutate(watch()); }} className="text-amber-600 text-[11px] underline mt-1 font-bold">Add anyway</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Expense Name *</label>
            <input {...register('name')} placeholder="Hotel booking, Dinner, Taxi..." className={clsx(inputClass, errors.name && '!border-danger/50')} />
            {errors.name && <p className="text-danger text-[11px] font-bold mt-1.5">{errors.name.message}</p>}
          </div>

          {/* Amount + Currency */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Amount *</label>
            <div className="flex gap-2">
              <select {...register('currency')} className={`${inputClass} w-28 flex-shrink-0 appearance-none cursor-pointer`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.85rem' }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
              <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className={clsx(inputClass, 'flex-1', errors.amount && '!border-danger/50')} />
            </div>
            {errors.amount && <p className="text-danger text-[11px] font-bold mt-1.5">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
            <select {...register('category')} className={`${inputClass} appearance-none cursor-pointer`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>

          {/* Paid By */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Paid By *</label>
            <select {...register('paidBy')} className={clsx(inputClass, 'appearance-none cursor-pointer', errors.paidBy && '!border-danger/50')} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
              <option value="">Select payer</option>
              {members.map(m => (
                <option key={m.user?._id} value={m.user?._id}>{m.user?.fullName}</option>
              ))}
            </select>
            {errors.paidBy && <p className="text-danger text-[11px] font-bold mt-1.5">{errors.paidBy.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Date</label>
            <input {...register('date')} type="date" className={inputClass} />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
              <span>Description</span>
              <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
            </label>
            <textarea {...register('description')} rows={2} placeholder="Additional details..." className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Receipt Upload + OCR */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
            <span>Receipt</span>
            <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex-1 min-h-[90px] border-2 border-dashed border-white/80 hover:border-primary-300 rounded-[20px] flex items-center justify-center flex-col gap-1.5 cursor-pointer transition-all bg-white/40 hover:bg-white/60 shadow-sm"
            >
              {receiptPreview ? (
                <div className="relative w-full flex items-center justify-center p-2">
                  <img src={receiptPreview} alt="Receipt" className="max-h-28 rounded-lg object-contain" />
                  <button type="button" onClick={e => { e.stopPropagation(); setReceipt(null); setReceiptPreview(null); }} className="absolute top-1 right-1 w-7 h-7 bg-danger rounded-full flex items-center justify-center shadow-sm">
                    <X size={13} className="text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera size={20} className="text-slate-400" />
                  <p className="text-slate-500 text-[11px] font-bold">Upload receipt image</p>
                </>
              )}
            </div>
            {receiptPreview && (
              <motion.button
                type="button"
                onClick={handleOCR}
                disabled={isScanning}
                className="flex items-center gap-2 text-[11px] font-bold px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 shadow-sm uppercase tracking-wider self-center transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isScanning ? <Spinner size="sm" /> : <Scan size={15} />}
                {isScanning ? 'Scanning...' : 'Scan OCR'}
              </motion.button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Split Type */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Split Method</label>
          <div className="flex gap-2">
            {['equal', 'percentage', 'custom'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { setSplitType(type); setValue('splitType', type); }}
                className={clsx(
                  'flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-full transition-all duration-300',
                  splitType === type
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'bg-white/60 border border-white/80 text-slate-600 hover:bg-white'
                )}
              >
                {type === 'equal' ? 'Equal' : type === 'percentage' ? '%' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
            Split Between ({selectedMembers.length} selected)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {members.map(m => {
              const userId = m.user?._id;
              const selected = selectedMembers.includes(userId);
              const splitData = customSplits.find(s => s.user === userId);
              return (
                <div
                  key={userId}
                  className={clsx(
                    'p-3.5 rounded-[18px] border transition-all duration-300 shadow-sm',
                    selected
                      ? 'bg-primary-50/50 border-primary-200'
                      : 'bg-white/40 border-white/60 hover:bg-white/70'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleMember(userId)}
                      className={clsx(
                        'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all',
                        selected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 bg-white'
                      )}
                    >
                      {selected && <Check size={12} className="stroke-[3]" />}
                    </button>
                    <Avatar src={m.user?.photo} name={m.user?.fullName} size="xs" />
                    <p className="text-slate-800 text-[12px] font-bold flex-1 truncate">{m.user?.fullName}</p>
                    {splitType === 'equal' && selected && (
                      <span className="text-primary-500 text-[11px] font-extrabold">₹{equalShare}</span>
                    )}
                  </div>
                  {selected && splitType === 'percentage' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="number" step="0.01" min="0" max="100"
                        value={splitData?.percentage || ''}
                        onChange={e => updateCustomSplit(userId, 'percentage', parseFloat(e.target.value))}
                        placeholder="0"
                        className={`${inputClass} !py-1.5 !px-3 text-xs w-20`}
                      />
                      <span className="text-slate-400 text-xs font-bold">%</span>
                      {watchedAmount && splitData?.percentage > 0 && (
                        <span className="text-primary-500 text-[11px] font-bold">≈ ₹{((parseFloat(watchedAmount) * splitData.percentage) / 100).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {selected && splitType === 'custom' && (
                    <div className="mt-2.5">
                      <input
                        type="number" step="0.01" min="0"
                        value={splitData?.amount || ''}
                        onChange={e => updateCustomSplit(userId, 'amount', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className={`${inputClass} !py-1.5 !px-3 text-xs`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation hints */}
          {splitType === 'percentage' && (
            <p className={clsx('text-[11px] mt-2 font-bold', Math.abs(totalPct - 100) < 0.01 ? 'text-success' : 'text-amber-500')}>
              Total: {totalPct.toFixed(1)}% {Math.abs(totalPct - 100) < 0.01 ? '✓' : '(must equal 100%)'}
            </p>
          )}
          {splitType === 'custom' && watchedAmount > 0 && (
            <p className={clsx('text-[11px] mt-2 font-bold', Math.abs(totalCustom - parseFloat(watchedAmount)) < 0.01 ? 'text-success' : 'text-amber-500')}>
              Total: ₹{totalCustom.toFixed(2)} / ₹{parseFloat(watchedAmount).toFixed(2)} {Math.abs(totalCustom - parseFloat(watchedAmount)) < 0.01 ? '✓' : ''}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
            <span>Notes</span>
            <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
          </label>
          <textarea {...register('notes')} rows={2} placeholder="Any additional notes..." className={`${inputClass} resize-none`} />
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-200/60">
          <button type="button" onClick={onClose} className="btn-secondary rounded-full py-3.5 px-8 font-bold tracking-wide shadow-sm flex-1">
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary rounded-full py-3.5 px-8 font-bold tracking-wide shadow-glow flex-[2] flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {mutation.isPending ? <Spinner size="sm" className="border-white" /> : isEdit ? '✓ Update Expense' : '+ Add Expense'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
