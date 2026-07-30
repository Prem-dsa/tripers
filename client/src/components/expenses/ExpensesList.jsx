import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit, Camera, Receipt,
  Hotel, UtensilsCrossed, Fuel, ShoppingBag, Car, Plane, Train, Ticket, Stethoscope, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { expenseApi } from '../../api';
import { GlassCard, Badge, EmptyState, Avatar, Spinner } from '../ui/index';
import { Modal, ConfirmModal } from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import AddExpenseModal from './AddExpenseModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['hotel','food','fuel','shopping','taxi','flights','train','entertainment','medical','other'];
const CAT_ICONS = {
  hotel: Hotel, food: UtensilsCrossed, fuel: Fuel, shopping: ShoppingBag,
  taxi: Car, flights: Plane, train: Train, entertainment: Ticket,
  medical: Stethoscope, other: Package
};
const CAT_CLASS = { hotel:'cat-hotel', food:'cat-food', fuel:'cat-fuel', shopping:'cat-shopping', taxi:'cat-taxi', flights:'cat-flights', train:'cat-train', entertainment:'cat-entertainment', medical:'cat-medical', other:'cat-other' };

const inputClass = 'w-full bg-white/50 border border-white/80 focus:border-primary-300 focus:bg-white/90 px-5 py-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[16px] transition-all shadow-sm outline-none';

export default function ExpensesList({ tripId, isAdmin }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', tripId, search, category],
    queryFn: () => expenseApi.getTripExpenses(tripId, { search, category }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', tripId]);
      queryClient.invalidateQueries(['trip', tripId]);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Expense deleted successfully');
      setDeleteTarget(null);
    },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const expenses = data?.expenses || [];
  const totalAmount = data?.totalAmount || 0;

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-200/60 pb-4">
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Expense Register</h3>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Total Balance: <span className="text-primary-500 font-extrabold text-sm">₹{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        <motion.button
          onClick={() => setAddModal(true)}
          className="btn-primary rounded-full text-[12px] font-bold uppercase tracking-wider py-3 px-6 shadow-glow flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Add Expense</span>
        </motion.button>
      </div>

      {/* Query Filter inputs */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] group">
          <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className={`${inputClass} pl-12`}
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={`${inputClass} w-44 appearance-none cursor-pointer`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Expenses Items Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-[20px]" />)}
        </div>
      ) : !expenses.length ? (
        <GlassCard className="bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px]">
          <EmptyState
            icon={<Receipt size={32} className="text-primary-500" />}
            title="No expenses logged"
            description="Click Add Expense to log details and splits."
            action={
              <button onClick={() => setAddModal(true)} className="btn-primary rounded-full py-3 px-6 font-bold tracking-wide shadow-glow text-[12px]">
                Add Expense
              </button>
            }
          />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {expenses.map((exp, i) => (
              <motion.div
                key={exp._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3.5 p-4 bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[22px] hover:bg-white hover:shadow-float transition-all duration-300 cursor-pointer group shadow-sm"
                onClick={() => setViewExpense(exp)}
              >
                <div className={clsx('w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 border bg-white shadow-sm', CAT_CLASS[exp.category])}>
                  {(() => {
                    const CatIcon = CAT_ICONS[exp.category] || Package;
                    return <CatIcon size={16} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-800 font-bold text-[13px] truncate group-hover:text-primary-500 transition-colors">
                      {exp.name}
                    </p>
                    <Badge variant="gray" className="text-[9px] capitalize">{exp.category}</Badge>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 font-medium">
                    Paid by <span className="text-slate-800 font-bold">{exp.paidBy?.fullName}</span>
                    {' • '}{format(new Date(exp.date), 'MMM d, yyyy')}
                    {' • '}{exp.splits?.length} members split
                  </p>
                </div>
                {exp.receipt && (
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 text-primary-500 flex-shrink-0" title="Receipt Attached">
                    <Camera size={13} />
                  </div>
                )}
                <div className="text-right flex-shrink-0 pl-1">
                  <p className="text-slate-800 font-bold text-[13px]">₹{formatCurrency(exp.amount)}</p>
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block mt-0.5">
                    {exp.splitType}
                  </span>
                </div>
                
                {(isAdmin || exp.addedBy?._id === user?._id) && (
                  <div className="flex gap-1 flex-shrink-0 ml-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEditExpense(exp)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                      title="Edit"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Expense modal */}
      <AddExpenseModal
        isOpen={addModal || !!editExpense}
        onClose={() => { setAddModal(false); setEditExpense(null); }}
        tripId={tripId}
        expense={editExpense}
        onSuccess={() => {
          queryClient.invalidateQueries(['expenses', tripId]);
          queryClient.invalidateQueries(['trip', tripId]);
          queryClient.invalidateQueries(['dashboard']);
        }}
      />

      {/* Delete confirmation alerts */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        loading={deleteMutation.isPending}
        title="Delete Logged Expense"
        message={`Delete "${deleteTarget?.name}" (₹${formatCurrency(deleteTarget?.amount || 0)})? Split calculations will update.`}
        confirmText="Delete Log"
        danger
      />

      {/* Item details modal popup */}
      <Modal isOpen={!!viewExpense} onClose={() => setViewExpense(null)} title="Expense Details" size="sm">
        {viewExpense && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 bg-white/60 p-4 rounded-[20px] border border-white/80 shadow-sm">
              <div className="w-12 h-12 rounded-[14px] bg-white border border-white flex items-center justify-center shadow-sm">
                {(() => {
                  const CatIcon = CAT_ICONS[viewExpense.category] || Package;
                  return <CatIcon size={20} className="text-primary-500" />;
                })()}
              </div>
              <div>
                <h3 className="text-slate-800 font-bold text-sm tracking-tight">{viewExpense.name}</h3>
                <Badge variant="primary" className="mt-1 text-[9px] capitalize">{viewExpense.category}</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-base font-extrabold text-primary-500">₹{formatCurrency(viewExpense.amount)}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">{viewExpense.splitType}</p>
              </div>
            </div>

            {viewExpense.description && (
              <p className="text-slate-500 text-xs bg-white/60 p-4 rounded-[16px] border border-white/80 leading-relaxed font-medium">
                {viewExpense.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/60 p-3.5 rounded-[16px] border border-white/80">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Paid By</p>
                <p className="text-slate-800 font-bold mt-1.5 flex items-center gap-2">
                  <Avatar src={viewExpense.paidBy?.photo} name={viewExpense.paidBy?.fullName} size="xs" />
                  <span className="truncate">{viewExpense.paidBy?.fullName}</span>
                </p>
              </div>
              <div className="bg-white/60 p-3.5 rounded-[16px] border border-white/80">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Date</p>
                <p className="text-slate-800 font-bold mt-3">{format(new Date(viewExpense.date), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {viewExpense.splits?.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Split Breakdown</p>
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {viewExpense.splits.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/60 p-3 rounded-[16px] border border-white/80">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.user?.photo} name={s.user?.fullName} size="xs" />
                        <p className="text-slate-800 text-xs font-bold">{s.user?.fullName}</p>
                      </div>
                      <p className="text-primary-500 font-extrabold text-xs">₹{formatCurrency(s.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewExpense.receipt && (
              <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Receipt Attachment</p>
                <a href={viewExpense.receipt} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-sm">
                  <img src={viewExpense.receipt} alt="Receipt Preview" className="w-full rounded-[20px] max-h-56 object-contain" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="text-[10px] font-bold uppercase text-slate-800 tracking-widest bg-white px-4 py-2 rounded-full shadow-md">View Original</span>
                  </div>
                </a>
              </div>
            )}
            
            {viewExpense.notes && (
              <div className="bg-white/60 p-3.5 rounded-[16px] border border-white/80">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Notes</p>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">{viewExpense.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
