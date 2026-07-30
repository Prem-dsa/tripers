import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';
import { TiltCard } from './TiltCard';

export { TiltCard };

export function GlassCard({ children, className, hover = false, onClick, animate = true }) {
  const Comp = animate ? motion.div : 'div';
  const props = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    ...(hover && {
      whileHover: { y: -4, scale: 1.01, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' },
      whileTap: { scale: 0.98 },
    })
  } : {};

  return (
    <Comp
      className={clsx(
        'glass p-6 transition-all duration-300 text-white',
        hover && 'cursor-pointer glass-hover',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function StatCard({ icon, label, value, sub, gradient = 'from-indigo-500 to-purple-500', trend, loading }) {
  if (loading) {
    return (
      <div className="glass-sm p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
        <div className="skeleton h-10 w-10 rounded-[14px]" />
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-8 w-28 rounded" />
      </div>
    );
  }
  return (
    <TiltCard className="h-full" maxTilt={5}>
      <motion.div
        className="glass-sm p-4 sm:p-5 flex flex-col gap-2 relative overflow-hidden group hover:bg-white/15 transition-all duration-500 cursor-default h-full text-white"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        
        <div className={clsx('w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center bg-gradient-to-br text-white shadow-glow flex-shrink-0', gradient)}>
          {typeof icon === 'string' ? (
            <span className="text-base">{icon}</span>
          ) : (
            icon
          )}
        </div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{value}</p>
        {sub && <p className="text-slate-300 text-[11px] mt-0.5 font-medium">{sub}</p>}
        {trend !== undefined && (
          <p className={clsx('text-[10px] font-bold mt-1 flex items-center gap-1 uppercase tracking-wider', trend >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </motion.div>
    </TiltCard>
  );
}

export function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-3xl'
  };
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = [
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  const baseClasses = 'rounded-full object-cover flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white/30';

  if (src) {
    return <img src={src} alt={name} className={clsx(baseClasses, sizes[size], className)} />;
  }
  return (
    <div className={clsx(baseClasses, 'bg-gradient-to-br', sizes[size], colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

export function Badge({ children, variant = 'primary', className }) {
  const variants = {
    primary: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    danger:  'bg-rose-500/20 text-rose-300 border-rose-500/30',
    gray:    'bg-white/10 text-slate-300 border-white/20',
  };
  return (
    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border', variants[variant], className)}>
      {children}
    </span>
  );
}

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className={clsx('border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin', sizes[size], className)} />
  );
}

export function ProgressBar({ value, max = 100, color = 'primary', className }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    secondary: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    accent: 'bg-gradient-to-r from-amber-400 to-orange-500',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600',
    success: 'bg-gradient-to-r from-emerald-400 to-green-500',
  };

  return (
    <div className={clsx('w-full bg-white/10 rounded-full overflow-hidden h-2 border border-white/10', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-700 ease-out shadow-glow-sm', colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="glass p-12 text-center flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
        {icon || <Inbox size={32} className="text-indigo-400" />}
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
        {description && <p className="text-slate-400 text-sm mt-1.5 max-w-sm leading-relaxed font-medium">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
