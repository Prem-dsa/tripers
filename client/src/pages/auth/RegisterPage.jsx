import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, Check, MapPin, ShieldCheck, Monitor, RefreshCw, Award } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import HeroScene from '../../components/three/HeroScene';
import toast from 'react-hot-toast';

const steps = [
  {
    title: 'Create your profile',
    schema: z.object({
      fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
      username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
    }),
    fields: ['fullName', 'username'],
  },
  {
    title: 'Contact details',
    schema: z.object({
      email: z.string().email('Please enter a valid email address'),
      phone: z.string().optional(),
    }),
    fields: ['email', 'phone'],
  },
  {
    title: 'Secure your account',
    schema: z.object({
      password: z.string().min(6, 'At least 6 characters'),
      confirmPassword: z.string(),
    }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] }),
    fields: ['password', 'confirmPassword'],
  },
];

const inputClass = 'w-full bg-white/90 border border-slate-200 focus:border-indigo-500 focus:bg-white px-5 py-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm outline-none';

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting }, trigger, watch } = useForm({
    resolver: zodResolver(steps[step].schema),
  });

  const passwordVal = watch('password') || '';

  const evaluatePassword = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const pwScore = evaluatePassword(passwordVal);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-danger', 'bg-amber-500', 'bg-yellow-500', 'bg-success'];

  const onNext = async (data) => {
    const isValid = await trigger(steps[step].fields);
    if (!isValid) return;
    const merged = { ...formData, ...data };
    setFormData(merged);

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      try {
        const res = await authApi.register(merged);
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        toast.success('Welcome to Tripers! 🎉 Your journey begins now.');
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex relative overflow-hidden font-sans">
      {/* Background */}
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

        <div className="relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Join thousands of<br />
              <span className="text-white/80">smart travelers.</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md font-medium">
              Create your free account and start managing travel expenses effortlessly with your group.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-4">
            {[
              { icon: Award, text: 'Free forever for personal trips' },
              { icon: ShieldCheck, text: 'Bank-grade security & encryption' },
              { icon: Monitor, text: 'Works on any device, anywhere' },
              { icon: RefreshCw, text: 'Real-time sync across your team' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-4 text-white/90">
                  <div className="w-10 h-10 rounded-[14px] bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-[13px] font-bold tracking-wide">{item.text}</span>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="text-white/50 text-[11px] font-medium relative z-10 uppercase tracking-widest">© 2026 Tripers Inc. All rights reserved.</div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          className="w-full max-w-[460px]"
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
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 rounded-t-[32px]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-100 rounded-full blur-[60px] opacity-50 pointer-events-none" />

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 relative z-10">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                    i < step ? 'bg-success text-white shadow-sm' :
                    i === step ? 'bg-primary-500 text-white shadow-glow' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {i < step ? <Check size={14} className="stroke-[3]" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-[3px] w-10 rounded-full transition-all duration-500 ${i < step ? 'bg-success' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
              <span className="ml-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step {step + 1}/{steps.length}</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1 relative z-10">{steps[step].title}</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 relative z-10">
              {step === 0 && 'Choose your Tripers identity.'}
              {step === 1 && 'How can we reach you?'}
              {step === 2 && 'Keep your account secure.'}
            </p>

            <AnimatePresence mode="wait">
              <motion.form
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onNext)}
                className="space-y-5 relative z-10"
              >
                {step === 0 && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Full Name</label>
                      <div className="relative group">
                        <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input {...register('fullName')} placeholder="Your full name" className={`${inputClass} pl-12 ${errors.fullName ? '!border-danger/50' : ''}`} />
                      </div>
                      {errors.fullName && <p className="text-danger text-[11px] font-bold mt-2">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Username</label>
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm group-focus-within:text-primary-500 transition-colors">@</span>
                        <input {...register('username')} placeholder="your_handle" className={`${inputClass} pl-11 ${errors.username ? '!border-danger/50' : ''}`} />
                      </div>
                      {errors.username && <p className="text-danger text-[11px] font-bold mt-2">{errors.username.message}</p>}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                      <div className="relative group">
                        <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input {...register('email')} placeholder="you@example.com" className={`${inputClass} pl-12 ${errors.email ? '!border-danger/50' : ''}`} />
                      </div>
                      {errors.email && <p className="text-danger text-[11px] font-bold mt-2">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                        <span>Phone</span>
                        <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
                      </label>
                      <div className="relative group">
                        <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input {...register('phone')} placeholder="+91 98765 43210" className={`${inputClass} pl-12`} />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Password</label>
                      <div className="relative group">
                        <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          {...register('password')}
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`${inputClass} pl-12 pr-12 ${errors.password ? '!border-danger/50' : ''}`}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-danger text-[11px] font-bold mt-2">{errors.password.message}</p>}
                      {/* Strength meter */}
                      {passwordVal && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-1.5">
                            {[0,1,2,3].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < pwScore ? strengthColors[pwScore - 1] : 'bg-slate-100'}`} />
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Strength: <span className="font-bold">{strengthLabels[pwScore - 1] || 'Very Weak'}</span></p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Confirm Password</label>
                      <div className="relative group">
                        <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={`${inputClass} pl-12 ${errors.confirmPassword ? '!border-danger/50' : ''}`} />
                      </div>
                      {errors.confirmPassword && <p className="text-danger text-[11px] font-bold mt-2">{errors.confirmPassword.message}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  {step > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="btn-secondary rounded-full py-4 px-8 font-bold tracking-wide shadow-sm flex-1 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft size={16} /> Back
                    </motion.button>
                  )}
                  <motion.button
                    type="submit"
                    className="btn-primary rounded-full py-4 px-8 font-bold tracking-wide shadow-glow flex-[2] flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : step === steps.length - 1 ? (
                      <>Create Account <Check size={16} className="stroke-[2.5]" /></>
                    ) : (
                      <>Continue <ArrowRight size={16} className="stroke-[2.5]" /></>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </AnimatePresence>

            <div className="mt-8 text-center border-t border-slate-200/60 pt-6 relative z-10">
              <p className="text-slate-500 text-sm font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-bold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
