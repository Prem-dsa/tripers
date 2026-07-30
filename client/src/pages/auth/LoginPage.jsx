import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, MapPin, Users, PieChart, Zap, Split } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import HeroScene from '../../components/three/HeroScene';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const inputClass = 'w-full bg-white/90 border border-slate-200 focus:border-indigo-500 focus:bg-white px-5 py-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm outline-none';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(`Welcome back, ${res.data.user.fullName.split(' ')[0]}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const features = [
    { icon: Split, label: 'Smart Split', sub: 'Equal, percent, or custom splits' },
    { icon: Zap, label: 'Instant Settle', sub: 'UPI, QR, and deep payment links' },
    { icon: PieChart, label: 'Analytics', sub: 'Beautiful spending insights' },
    { icon: Users, label: 'Team Trips', sub: 'Collaborate with your travel crew' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex relative overflow-hidden font-sans">
      {/* Background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-primary-200/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-secondary-200/20 rounded-full blur-[100px]" />
        
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-16 h-16 rounded-[20px] bg-white/40 border border-white/60 backdrop-blur-md shadow-sm"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full bg-white/30 border border-white/40 backdrop-blur-md shadow-sm"
        />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-primary-500 via-purple-500 to-secondary-500 p-14 relative z-10 justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px'}} />
        <HeroScene className="absolute inset-0 z-0 opacity-40 overflow-hidden" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-[16px] flex items-center justify-center border border-white/30 shadow-sm">
            <MapPin size={20} className="text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-white text-xl leading-none tracking-tight">Tripers</p>
            <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-1">Travel Together. Split Smarter.</p>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Plan trips.<br />
              Split expenses.<br />
              <span className="text-white/80">Travel together.</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md font-medium">
              The premium travel expense management platform for modern travelers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.label} className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[24px] hover:bg-white/15 transition-colors">
                  <div className="w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-[13px] tracking-wide">{feat.label}</p>
                  <p className="text-white/60 text-[11px] mt-1 leading-relaxed font-medium">{feat.sub}</p>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="text-white/50 text-[11px] font-medium relative z-10 uppercase tracking-widest">
          © 2026 Tripers Inc. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          className="w-full max-w-[440px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-[16px] flex items-center justify-center shadow-glow">
              <MapPin size={20} className="text-white stroke-[2.5]" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-xl tracking-tight">Tripers</p>
              <p className="text-primary-500 text-[11px] font-bold uppercase tracking-widest">Travel Together</p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[32px] p-8 sm:p-10 shadow-float relative overflow-hidden">
            {/* Accent gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 rounded-t-[32px]" />
            
            {/* Decorative blur */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-100 rounded-full blur-[60px] opacity-50 pointer-events-none" />

            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2 relative z-10">Welcome back</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 relative z-10">Sign in to your Tripers account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email address</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    {...register('email')}
                    placeholder="you@example.com"
                    className={`${inputClass} pl-12 ${errors.email ? '!border-danger/50' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-danger text-[11px] font-bold mt-2">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-primary-500 text-[11px] font-bold hover:text-primary-600 transition-colors uppercase tracking-wider">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${inputClass} pl-12 pr-12 ${errors.password ? '!border-danger/50' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-[11px] font-bold mt-2">{errors.password.message}</p>}
              </div>

              <motion.button
                type="submit"
                className="btn-primary w-full py-4 rounded-full shadow-glow flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={16} className="stroke-[2.5]" /></>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center border-t border-slate-200/60 pt-6 relative z-10">
              <p className="text-slate-500 text-sm font-medium">
                New to Tripers?{' '}
                <Link to="/register" className="text-primary-500 hover:text-primary-600 font-bold transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
