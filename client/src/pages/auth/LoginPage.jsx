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
    <div className="min-h-screen bg-[#F8F5FF] flex relative overflow-hidden font-sans">
      {/* Subtle background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-[#6D4AFF]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
        
        {/* Luxury Floating Shapes */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-16 h-16 rounded-3xl bg-gradient-to-br from-[#6D4AFF]/20 to-[#8B5CF6]/5 border border-[#E9E2FF] backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-[#A855F7]/10 to-[#8B5CF6]/0 border border-[#E9E2FF] backdrop-blur-sm"
        />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-[#6D4AFF] via-[#8B5CF6] to-[#A855F7] p-14 relative z-10 justify-between overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px'}} />

        {/* 3D hero scene */}
        <HeroScene className="absolute -top-10 -right-16 w-[420px] h-[420px] z-0" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex-center border border-white/30">
            <MapPin size={18} className="text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-white text-lg leading-none tracking-tight">Tripers</p>
            <p className="text-white/80 text-xs font-semibold mt-0.5">Travel Together. Split Smarter.</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Plan trips.<br />
              Split expenses.<br />
              <span className="text-white/85">Travel together.</span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
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
                <div key={feat.label} className="bg-white/10 backdrop-blur-sm border border-white/25 p-4 rounded-2xl">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-sm">{feat.label}</p>
                  <p className="text-white/70 text-xs mt-1 leading-normal">{feat.sub}</p>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="text-white/60 text-xs font-medium relative z-10">
          © 2026 Tripers Inc. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6D4AFF] to-[#8B5CF6] rounded-xl flex-center shadow-glow-sm">
              <MapPin size={18} className="text-white stroke-[2.5]" />
            </div>
            <div>
              <p className="font-extrabold text-[#1E1B4B] text-xl tracking-tight">Tripers</p>
              <p className="text-[#6D4AFF] text-xs font-bold">Travel Together. Split Smarter.</p>
            </div>
          </div>

          <div className="bg-white border border-[#E9E2FF] rounded-[24px] p-8 shadow-float relative overflow-hidden">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] rounded-t-3xl" />

            <h2 className="text-2xl font-bold text-[#1E1B4B] tracking-tight mb-1">Welcome back</h2>
            <p className="text-[#6B5CA5] text-sm mb-7">Sign in to your Tripers account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                  <input
                    {...register('email')}
                    placeholder="you@example.com"
                    className={`input pl-11 ${errors.email ? 'input-error' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-[#6D4AFF] text-xs font-semibold hover:text-[#5A38E8] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] hover:text-[#1E1B4B] transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <motion.button
                type="submit"
                className="btn-primary btn w-full py-3 mt-2"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={15} className="stroke-[2.5]" /></>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center border-t border-[#E9E2FF] pt-5">
              <p className="text-[#6B5CA5] text-sm">
                New to Tripers?{' '}
                <Link to="/register" className="text-[#6D4AFF] hover:text-[#5A38E8] font-bold transition-colors">
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
