import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { clsx } from 'clsx';

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl', full: 'sm:max-w-6xl' };

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal / Bottom Sheet on Mobile */}
          <motion.div
            className={clsx(
              'relative w-full bg-slate-900/95 backdrop-blur-[40px] border border-white/20 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] text-white overflow-hidden z-10 select-none',
              sizes[size]
            )}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ opacity: 0, y: 100, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            {/* Mobile Drag Indicator Handle */}
            <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 sm:p-6 border-b border-white/15 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-10"
                aria-label="Close modal"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 sm:p-6 border-t border-white/15 flex-shrink-0 flex gap-3 justify-end bg-white/5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary py-3 px-6 rounded-full text-xs font-bold min-h-[48px]">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={clsx(
            'btn py-3 px-6 rounded-full text-xs uppercase font-bold tracking-wider min-h-[48px]',
            danger ? 'btn-danger' : 'btn-primary'
          )}
        >
          {loading ? 'Loading...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
