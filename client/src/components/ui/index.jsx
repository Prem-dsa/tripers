import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';

export function GlassCard({ children, className, hover = false, onClick, animate = true }) {
  const Comp = animate ? motion.div : 'div';
  const props = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    ...(hover && {
      whileHover: { y: -4, scale: 1.005, borderColor: '#D0C6FF', boxShadow: '0 12px 40px rgba(109,74,255,0.12), 0 2px 8px rgba(109,74,255,0.06)' },
      whileTap: { scale: 0.995 },
    })
  } : {};

  return (
    <Comp
      className={clsx(
        'bg-white border border-[#E9E2FF] rounded-[24px] p-6 transition-all duration-300 shadow-card text-[#1E1B4B]',
        hover && 'cursor-pointer hover:bg-white',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function StatCard({ icon, label, value, sub, gradient = 'from-[#6D4AFF] to-[#8B5CF6]', trend, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#E9E2FF] p-6 rounded-[24px] flex flex-col gap-3 shadow-card">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-7 w-28 rounded" />
      </div>
    );
  }
  return (
    <motion.div
      className="bg-white border border-[#E9E2FF] p-6 rounded-[24px] flex flex-col gap-2 relative overflow-hidden group hover:border-[#D0C6FF] shadow-card hover:shadow-card-hover transition-all duration-500 cursor-default text-[#1E1B4B]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6D4AFF]/5 to-[#8B5CF6]/0 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      
      <div className={clsx('w-9 h-9 rounded-xl flex-center bg-gradient-to-br text-white shadow-sm border border-white/20', gradient)}>
        {typeof icon === 'string' ? (
          <span className="text-sm">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <p className="text-[#6B5CA5] text-[10px] font-bold uppercase tracking-widest mt-1">{label}</p>
      <p className="text-xl font-bold text-[#1E1B4B] tracking-tight mt-0.5">{value}</p>
      {sub && <p className="text-[#6B5CA5] text-xs mt-1 font-medium">{sub}</p>}
      {trend !== undefined && (
        <p className={clsx('text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </p>
      )}
    </motion.div>
  );
}

export function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-3xl'
  };
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = [
    'from-[#6D4AFF] to-[#8B5CF6]',
    'from-[#8B5CF6] to-[#A855F7]',
    'from-emerald-500 to-green-600',
    'from-blue-500 to-indigo-600',
    'from-amber-500 to-orange-600'
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  const baseClasses = 'rounded-full object-cover flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-black/5';

  if (src) {
    return <img src={src} alt={name} className={clsx(baseClasses, sizes[size], className)} />;
  }
  return (
    <div className={clsx(baseClasses, 'bg-gradient-to-br', sizes[size], colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

export function Badge({ children, variant = 'gray', className }) {
  const variants = {
    gray: 'bg-[#F3F0FF] text-[#6B5CA5] border border-[#E9E2FF]',
    primary: 'bg-[#F3F0FF] text-[#6D4AFF] border border-[#EDE8FF]',
    success: 'bg-[#DCFCE7] text-emerald-700 border border-emerald-200',
    warning: 'bg-[#FEF3C7] text-amber-700 border border-amber-200',
    danger: 'bg-[#FEE2E2] text-red-700 border border-red-200',
  };
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function LoadingSkeleton({ lines = 3, className }) {
  return (
    <div className={clsx('space-y-2.5 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={clsx('skeleton h-3.5 rounded-lg', i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      className="empty-state py-12"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 flex-center">
        {typeof icon === 'string' ? (
          <span className="text-5xl select-none">{icon || '📭'}</span>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#F3F0FF] border border-[#E9E2FF] flex-center">
            {icon || <Inbox size={28} className="text-[#6D4AFF]" />}
          </div>
        )}
      </div>
      <h3 className="text-[#1E1B4B] font-bold text-sm mb-1.5 tracking-tight">{title}</h3>
      {description && <p className="text-[#6B5CA5] text-xs max-w-[260px] mb-6 leading-relaxed font-medium">{description}</p>}
      {action}
    </motion.div>
  );
}

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-[2.5px]', lg: 'w-12 h-12 border-3' };
  return (
    <div className={clsx('rounded-full border-[#6D4AFF] border-t-transparent animate-spin', sizes[size], className)} />
  );
}

export function ProgressBar({ value, max = 100, className, color = 'primary' }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors = {
    primary: 'bg-gradient-to-r from-[#6D4AFF] via-[#8B5CF6] to-[#A855F7]',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500'
  };
  return (
    <div className={clsx('h-2 bg-[#F3F0FF] border border-[#E9E2FF] rounded-full overflow-hidden relative', className)}>
      <motion.div
        className={clsx('h-full rounded-full relative', colors[color])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 blur-xs rounded-full" />
      </motion.div>
    </div>
  );
}

export function Tooltip({ children, content }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-white border border-[#E9E2FF] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[#1E1B4B] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-card">
        {content}
      </div>
    </div>
  );
}

export function Divider({ label }) {
  if (!label) return <div className="divider" />;
  return (
    <div className="flex items-center gap-4 my-5">
      <div className="flex-1 h-px bg-[#E9E2FF]" />
      <span className="text-[#6B5CA5] text-[9px] font-bold uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-[#E9E2FF]" />
    </div>
  );
}
