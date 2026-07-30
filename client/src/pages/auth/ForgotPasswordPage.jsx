import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, MapPin } from 'lucide-react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const inputClass = 'w-full bg-white/90 border border-slate-200 focus:border-indigo-500 focus:bg-white px-5 py-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm outline-none';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-primary-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-60 -left-60 w-[400px] h-[400px] bg-secondary-200/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] w-16 h-16 rounded-[20px] bg-white/40 border border-white/60 backdrop-blur-md shadow-sm pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full bg-white/30 border border-white/40 backdrop-blur-md shadow-sm pointer-events-none"
      />

      <motion.div className="w-full max-w-md relative z-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-[16px] flex items-center justify-center shadow-glow">
            <MapPin size={20} className="text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800 text-xl tracking-tight">Tripers</p>
            <p className="text-primary-500 text-[11px] font-bold uppercase tracking-widest">Travel Together</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[32px] p-8 sm:p-10 shadow-float relative overflow-hidden">
          {/* Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 rounded-t-[32px]" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-100 rounded-full blur-[60px] opacity-50 pointer-events-none" />

          {sent ? (
            <motion.div className="text-center relative z-10" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-[20px] flex items-center justify-center text-3xl mx-auto mb-5">📧</div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                We've sent a password reset link to <span className="text-primary-500 font-bold">{email}</span>. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary w-full py-4 rounded-full shadow-glow flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest">
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">Forgot your password?</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={`${inputClass} pl-12`}
                    />
                  </div>
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 rounded-full shadow-glow flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Send size={15} /> Send Reset Link</>
                  }
                </motion.button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-slate-500 text-sm font-medium hover:text-primary-500 flex items-center gap-1.5 justify-center transition-colors">
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
