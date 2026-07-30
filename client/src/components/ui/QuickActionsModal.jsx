import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plane, Receipt, Wallet, Camera, X, Plus, Sparkles } from 'lucide-react';

export function QuickActionsModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Plan New Trip',
      description: 'Create a new travel folder & invite friends',
      icon: Plane,
      gradient: 'from-indigo-500 to-purple-500',
      to: '/trips/new',
    },
    {
      title: 'Log Expense',
      description: 'Record an expense entry & split bills',
      icon: Receipt,
      gradient: 'from-purple-500 to-pink-500',
      to: '/expenses',
    },
    {
      title: 'Pay / Settle Up',
      description: 'Confirm or request payment settlements',
      icon: Wallet,
      gradient: 'from-emerald-400 to-teal-500',
      to: '/settlements',
    },
    {
      title: 'Scan Receipt (OCR)',
      description: 'Upload receipt photo for instant parsing',
      icon: Camera,
      gradient: 'from-amber-400 to-orange-500',
      to: '/expenses',
    },
  ];

  const handleSelect = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal / Sheet Content */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md bg-slate-900/95 border border-white/20 rounded-t-[32px] sm:rounded-[32px] p-6 text-white shadow-2xl overflow-hidden z-10 select-none"
          style={{
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
          }}
        >
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Title bar */}
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Quick Actions</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Actions List */}
          <div className="grid grid-cols-1 gap-3 relative z-10">
            {actions.map((action) => (
              <motion.button
                key={action.title}
                onClick={() => handleSelect(action.to)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 p-4 rounded-[22px] bg-white/8 border border-white/15 hover:bg-white/15 hover:border-white/30 transition-all text-left group shadow-sm"
              >
                <div className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-glow flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <action.icon size={20} className="stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-[15px] group-hover:text-indigo-300 transition-colors">{action.title}</p>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5 truncate">{action.description}</p>
                </div>
                <Plus size={16} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
