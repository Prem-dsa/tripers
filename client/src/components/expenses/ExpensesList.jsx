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
    <div className="space-y-5 text-[#1E1B4B]">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-[#E9E2FF] pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1E1B4B] uppercase tracking-wider">Expense Register</h3>
          <p className="text-[#6B5CA5] text-xs mt-1">
            Total Balance: <span className="text-[#6D4AFF] font-bold">₹{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="btn-primary btn text-xs py-2 px-3.5 rounded-xl shadow-glow-sm"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Query Filter inputs */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="input pl-9 text-xs py-2.5 bg-[#F8F5FF] border-[#E9E2FF]"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="input py-2.5 text-xs w-40 bg-[#F8F5FF] border-[#E9E2FF] text-[#1E1B4B]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Items Grid */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}
        </div>
      ) : !expenses.length ? (
        <EmptyState
          icon={<Receipt size={32} className="text-[#6D4AFF]" />}
          title="No expenses logged"
          description="Click Add Expense to log details and splits."
          action={
            <button onClick={() => setAddModal(true)} className="btn-primary btn text-xs rounded-xl py-2 px-4 shadow-glow-sm">
              Add Expense
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {expenses.map((exp, i) => (
              <motion.div
                key={exp._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 p-3.5 bg-white border border-[#E9E2FF] rounded-2xl hover:bg-[#F8F5FF] hover:border-[#D0C6FF] transition-all duration-305 cursor-pointer group shadow-sm"
                onClick={() => setViewExpense(exp)}
              >
                <div className={clsx('w-9 h-9 rounded-xl flex-center flex-shrink-0 border bg-[#F8F5FF]', CAT_CLASS[exp.category])}>
                  {(() => {
                    const CatIcon = CAT_ICONS[exp.category] || Package;
                    return <CatIcon size={14} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#1E1B4B] font-bold text-xs truncate group-hover:text-[#6D4AFF] transition-colors">
                      {exp.name}
                    </p>
                    <Badge variant="gray" className="text-[8px] tracking-wide">{exp.category}</Badge>
                  </div>
                  <p className="text-[#6B5CA5] text-[10px] mt-1 font-medium">
                    Paid by <span className="text-[#1E1B4B] font-semibold">{exp.paidBy?.fullName}</span>
                    {' • '}{format(new Date(exp.date), 'MMM d, yyyy')}
                    {' • '}{exp.splits?.length} members split
                  </p>
                </div>
                {exp.receipt && (
                  <div className="w-7 h-7 rounded-lg bg-[#F3F0FF] flex-center border border-[#EDE8FF] text-[#6D4AFF] flex-shrink-0" title="Receipt Attached">
                    <Camera size={12} />
                  </div>
                )}
                <div className="text-right flex-shrink-0 pl-1">
                  <p className="text-[#1E1B4B] font-bold text-xs">₹{formatCurrency(exp.amount)}</p>
                  <span className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-wider block mt-0.5">
                    {exp.splitType}
                  </span>
                </div>
                
                {(isAdmin || exp.addedBy?._id === user?._id) && (
                  <div className="flex gap-1 flex-shrink-0 ml-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEditExpense(exp)}
                      className="btn-icon w-7 h-7 hover:bg-[#F3F0FF] hover:border-[#E9E2FF] text-[#6B5CA5] hover:text-[#6D4AFF] rounded-lg"
                      title="Edit"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="btn-icon w-7 h-7 hover:bg-red-50 hover:border-red-100 text-[#6B5CA5] hover:text-red-550 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={12} />
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
          <div className="space-y-5 text-[#1E1B4B]">
            <div className="flex items-center gap-3 bg-[#F8F5FF] p-3 rounded-2xl border border-[#E9E2FF]">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E9E2FF] flex-center shadow-inner">
                {(() => {
                  const CatIcon = CAT_ICONS[viewExpense.category] || Package;
                  return <CatIcon size={20} className="text-[#6D4AFF]" />;
                })()}
              </div>
              <div>
                <h3 className="text-[#1E1B4B] font-bold text-sm tracking-tight">{viewExpense.name}</h3>
                <Badge variant="primary" className="mt-1 text-[8px]">{viewExpense.category}</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-base font-bold text-[#6D4AFF]">₹{formatCurrency(viewExpense.amount)}</p>
                <p className="text-[#6B5CA5] text-[8px] font-bold uppercase tracking-wider mt-0.5">{viewExpense.splitType}</p>
              </div>
            </div>

            {viewExpense.description && (
              <p className="text-[#6B5CA5] text-xs bg-[#F8F5FF] p-3 rounded-xl border border-[#E9E2FF] leading-relaxed font-semibold">
                {viewExpense.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F8F5FF] p-2.5 rounded-xl border border-[#E9E2FF]">
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">Paid By</p>
                <p className="text-[#1E1B4B] font-semibold mt-1 flex items-center gap-1.5">
                  <Avatar src={viewExpense.paidBy?.photo} name={viewExpense.paidBy?.fullName} size="xs" />
                  <span className="truncate">{viewExpense.paidBy?.fullName}</span>
                </p>
              </div>
              <div className="bg-[#F8F5FF] p-2.5 rounded-xl border border-[#E9E2FF]">
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">Date</p>
                <p className="text-[#1E1B4B] font-semibold mt-2.5">{format(new Date(viewExpense.date), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {viewExpense.splits?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">Split Breakdown</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollable">
                  {viewExpense.splits.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#F8F5FF] p-2.5 rounded-xl border border-[#E9E2FF]">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.user?.photo} name={s.user?.fullName} size="xs" />
                        <p className="text-[#1E1B4B] text-xs font-semibold">{s.user?.fullName}</p>
                      </div>
                      <p className="text-[#6D4AFF] font-bold text-xs">₹{formatCurrency(s.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewExpense.receipt && (
              <div className="space-y-2">
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">Receipt Attachment</p>
                <a href={viewExpense.receipt} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-2xl border border-[#E9E2FF] bg-[#F8F5FF]">
                  <img src={viewExpense.receipt} alt="Receipt Preview" className="w-full rounded-2xl max-h-56 object-contain cursor-zoom-in" />
                  <div className="absolute inset-0 bg-[#1E1B4B]/40 opacity-0 group-hover:opacity-100 flex-center transition-all">
                    <span className="text-[10px] font-bold uppercase text-[#1E1B4B] tracking-widest bg-white px-3 py-1.5 border border-[#E9E2FF] rounded-xl">View Original</span>
                  </div>
                </a>
              </div>
            )}
            
            {viewExpense.notes && (
              <div className="bg-[#F8F5FF] p-3 rounded-xl border border-[#E9E2FF]">
                <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-wider">Notes</p>
                <p className="text-[#6B5CA5] text-xs mt-1.5 leading-relaxed font-semibold">{viewExpense.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
