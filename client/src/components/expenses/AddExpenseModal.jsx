import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, X, Scan, AlertCircle } from 'lucide-react';
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-[#1E1B4B]">
        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-medium">{duplicateWarning}</p>
              <button type="button" onClick={() => { setDuplicateWarning(null); mutation.mutate(watch()); }} className="text-[#F59E0B] text-xs underline mt-1 font-bold">Add anyway</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="label">Expense Name *</label>
            <input {...register('name')} placeholder="Hotel booking, Dinner, Petrol..." className={clsx('input bg-white border-[#E9E2FF]', errors.name && 'input-error')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Amount + Currency */}
          <div>
            <label className="label">Amount *</label>
            <div className="flex gap-2">
              <select {...register('currency')} className="input w-24 flex-shrink-0 py-2.5 bg-white border-[#E9E2FF]">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
              <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className={clsx('input flex-1 bg-white border-[#E9E2FF]', errors.amount && 'input-error')} />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select {...register('category')} className="input bg-white border-[#E9E2FF]">
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>

          {/* Paid By */}
          <div>
            <label className="label">Paid By *</label>
            <select {...register('paidBy')} className={clsx('input bg-white border-[#E9E2FF]', errors.paidBy && 'input-error')}>
              <option value="">Select payer</option>
              {members.map(m => (
                <option key={m.user?._id} value={m.user?._id}>{m.user?.fullName}</option>
              ))}
            </select>
            {errors.paidBy && <p className="text-red-500 text-xs mt-1">{errors.paidBy.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input {...register('date')} type="date" className="input bg-white border-[#E9E2FF]" />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="label">Description <span className="text-[#6B5CA5]/60">(optional)</span></label>
            <textarea {...register('description')} rows={2} placeholder="Additional details..." className="input resize-none bg-white border-[#E9E2FF]" />
          </div>
        </div>

        {/* Receipt Upload + OCR */}
        <div>
          <label className="label">Receipt <span className="text-[#6B5CA5]/60">(optional)</span></label>
          <div className="flex gap-3 flex-wrap">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex-1 min-h-24 border-2 border-dashed border-[#E9E2FF] hover:border-[#6D4AFF]/50 rounded-xl flex-center flex-col gap-2 cursor-pointer transition-all bg-[#F8F5FF]"
            >
              {receiptPreview ? (
                <div className="relative w-full flex-center">
                  <img src={receiptPreview} alt="Receipt" className="max-h-32 rounded-lg object-contain" />
                  <button type="button" onClick={e => { e.stopPropagation(); setReceipt(null); setReceiptPreview(null); }} className="absolute top-1 right-1 w-6 h-6 bg-[#EF4444] rounded-full flex-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera size={20} className="text-[#6B5CA5]" />
                  <p className="text-[#6B5CA5] text-xs">Upload receipt</p>
                </>
              )}
            </div>
            {receiptPreview && (
              <button type="button" onClick={handleOCR} disabled={isScanning} className="btn-outline btn gap-2 text-sm self-start">
                {isScanning ? <Spinner size="sm" /> : <Scan size={15} />}
                {isScanning ? 'Scanning...' : 'Scan OCR'}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Split Type */}
        <div>
          <label className="label">Split Method</label>
          <div className="flex gap-2">
            {['equal', 'percentage', 'custom'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { setSplitType(type); setValue('splitType', type); }}
                className={clsx('btn flex-1 text-sm capitalize', splitType === type ? 'btn-primary' : 'btn-secondary')}
              >
                {type === 'equal' ? 'Equal' : type === 'percentage' ? '%' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className="label">Split Between ({selectedMembers.length} selected)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map(m => {
              const userId = m.user?._id;
              const selected = selectedMembers.includes(userId);
              const splitData = customSplits.find(s => s.user === userId);
              return (
                <div key={userId} className={clsx('p-3 rounded-xl border transition-all', selected ? 'border-[#6D4AFF]/40 bg-[#F3F0FF]' : 'border-[#E9E2FF] bg-white hover:border-[#D0C6FF]')}>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleMember(userId)} className={clsx('w-5 h-5 rounded border-2 flex-center flex-shrink-0 transition-all', selected ? 'bg-[#6D4AFF] border-[#6D4AFF]' : 'border-[#E9E2FF]')}>
                      {selected && <span className="text-white text-[10px]">✓</span>}
                    </button>
                    <Avatar src={m.user?.photo} name={m.user?.fullName} size="xs" className="ring-1 ring-black/5" />
                    <p className="text-[#1E1B4B] text-sm font-semibold flex-1 truncate">{m.user?.fullName}</p>
                    {splitType === 'equal' && selected && (
                      <span className="text-[#6D4AFF] text-xs font-extrabold">₹{equalShare}</span>
                    )}
                  </div>
                  {selected && splitType === 'percentage' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number" step="0.01" min="0" max="100"
                        value={splitData?.percentage || ''}
                        onChange={e => updateCustomSplit(userId, 'percentage', parseFloat(e.target.value))}
                        placeholder="0"
                        className="input py-1 text-sm w-20 bg-white border-[#E9E2FF]"
                      />
                      <span className="text-[#6B5CA5] text-sm">%</span>
                      {watchedAmount && splitData?.percentage > 0 && (
                        <span className="text-[#6D4AFF] text-xs font-semibold">≈ ₹{((parseFloat(watchedAmount) * splitData.percentage) / 100).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {selected && splitType === 'custom' && (
                    <div className="mt-2">
                      <input
                        type="number" step="0.01" min="0"
                        value={splitData?.amount || ''}
                        onChange={e => updateCustomSplit(userId, 'amount', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="input py-1 text-sm bg-white border-[#E9E2FF]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation hints */}
          {splitType === 'percentage' && (
            <p className={clsx('text-xs mt-2 font-semibold', Math.abs(totalPct - 100) < 0.01 ? 'text-green-600' : 'text-[#F59E0B]')}>
              Total: {totalPct.toFixed(1)}% {Math.abs(totalPct - 100) < 0.01 ? '✓' : '(must equal 100%)'}
            </p>
          )}
          {splitType === 'custom' && watchedAmount > 0 && (
            <p className={clsx('text-xs mt-2 font-semibold', Math.abs(totalCustom - parseFloat(watchedAmount)) < 0.01 ? 'text-green-600' : 'text-[#F59E0B]')}>
              Total: ₹{totalCustom.toFixed(2)} / ₹{parseFloat(watchedAmount).toFixed(2)} {Math.abs(totalCustom - parseFloat(watchedAmount)) < 0.01 ? '✓' : ''}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes <span className="text-[#6B5CA5]/60">(optional)</span></label>
          <textarea {...register('notes')} rows={2} placeholder="Any additional notes..." className="input resize-none bg-white border-[#E9E2FF]" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline btn flex-1">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary btn flex-1 gap-2 shadow-glow-sm">
            {mutation.isPending ? <Spinner size="sm" /> : isEdit ? '✓ Update' : '+ Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
