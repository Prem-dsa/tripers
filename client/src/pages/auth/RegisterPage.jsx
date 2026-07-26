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
  const strengthColors = ['bg-red-450', 'bg-amber-450', 'bg-yellow-450', 'bg-emerald-500'];

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
    <div className="min-h-screen bg-[#F8F5FF] flex relative overflow-hidden font-sans">
      {/* Background */}
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
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px'}} />
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

        <div className="relative z-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Join thousands of<br />
              <span className="text-white/85">smart travelers.</span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
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
                <div key={idx} className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold">{item.text}</span>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="text-white/60 text-xs font-medium relative z-10">© 2026 Tripers Inc. All rights reserved.</div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          className="w-full max-w-[440px]"
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
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] rounded-t-3xl" />

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex-center text-xs font-bold transition-all duration-300 ${
                    i < step ? 'bg-[#22C55E] text-white' :
                    i === step ? 'bg-[#6D4AFF] text-white' :
                    'bg-[#F3F0FF] text-[#6B5CA5]'
                  }`}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-8 rounded transition-all duration-300 ${i < step ? 'bg-[#22C55E]' : 'bg-[#E9E2FF]'}`} />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs text-[#6B5CA5] font-bold">Step {step + 1} of {steps.length}</span>
            </div>

            <h2 className="text-xl font-bold text-[#1E1B4B] tracking-tight mb-1">{steps[step].title}</h2>
            <p className="text-[#6B5CA5] text-sm mb-6">
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
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <div>
                      <label className="label">Full Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                        <input {...register('fullName')} placeholder="Your full name" className={`input pl-11 ${errors.fullName ? 'input-error' : ''}`} />
                      </div>
                      {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <label className="label">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] font-semibold text-sm">@</span>
                        <input {...register('username')} placeholder="your_handle" className={`input pl-9 ${errors.username ? 'input-error' : ''}`} />
                      </div>
                      {errors.username && <p className="text-red-500 text-xs mt-1.5">{errors.username.message}</p>}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                        <input {...register('email')} placeholder="you@example.com" className={`input pl-11 ${errors.email ? 'input-error' : ''}`} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="label">Phone <span className="text-[#6B5CA5]/60 font-normal normal-case">(optional)</span></label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                        <input {...register('phone')} placeholder="+91 98765 43210" className="input pl-11" />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                        <input
                          {...register('password')}
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] hover:text-[#1E1B4B]">
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                      {/* Strength meter */}
                      {passwordVal && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[0,1,2,3].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < pwScore ? strengthColors[pwScore - 1] : 'bg-[#E9E2FF]'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-[#6B5CA5]">Strength: <span className="font-semibold">{strengthLabels[pwScore - 1] || 'Very Weak'}</span></p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label">Confirm Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                        <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={`input pl-11 ${errors.confirmPassword ? 'input-error' : ''}`} />
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="btn-outline btn flex-1"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <ArrowLeft size={15} /> Back
                    </motion.button>
                  )}
                  <motion.button
                    type="submit"
                    className="btn-primary btn flex-1"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : step === steps.length - 1 ? (
                      <>Create Account <Check size={15} /></>
                    ) : (
                      <>Continue <ArrowRight size={15} /></>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </AnimatePresence>

            <div className="mt-6 text-center border-t border-[#E9E2FF] pt-5">
              <p className="text-[#6B5CA5] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[#6D4AFF] hover:text-[#5A38E8] font-bold transition-colors">
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
