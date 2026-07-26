import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, MapPin } from 'lucide-react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-primary-100/60 rounded-full blur-[120px]" />
      <div className="absolute -bottom-60 -left-60 w-[400px] h-[400px] bg-secondary-500/5 rounded-full blur-[100px]" />

      <motion.div className="w-full max-w-md relative z-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex-center shadow-glow-sm">
            <MapPin size={18} className="text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-surface-900 text-xl tracking-tight">Tripers</p>
            <p className="text-primary-500 text-xs font-medium">Travel Together. Split Smarter.</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-3xl p-8 shadow-float relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-3xl" />

          {sent ? (
            <motion.div className="text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex-center text-3xl mx-auto mb-4">📧</div>
              <h2 className="text-xl font-bold text-surface-900 mb-2">Check your email</h2>
              <p className="text-surface-500 text-sm mb-6">
                We've sent a password reset link to <span className="text-primary-600 font-medium">{email}</span>. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary btn w-full justify-center">Back to Login</Link>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-surface-900 mb-1">Forgot your password?</h2>
              <p className="text-surface-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input pl-11"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary btn w-full gap-2">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Send size={14} /> Send Reset Link</>
                  }
                </button>
              </form>
              <div className="mt-5 text-center">
                <Link to="/login" className="text-surface-400 text-sm hover:text-surface-600 flex items-center gap-1 justify-center transition-colors">
                  <ArrowLeft size={13} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
