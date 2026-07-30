import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, MapPin } from 'lucide-react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const inputClass = 'w-full bg-white/90 border border-slate-200 focus:border-indigo-500 focus:bg-white px-5 py-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm outline-none';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed or link expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-200/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 right-[12%] w-14 h-14 rounded-[16px] bg-white/40 border border-white/60 backdrop-blur-md shadow-sm pointer-events-none"
      />

      <motion.div className="w-full max-w-md relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

          <div className="relative z-10">
            <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-[18px] flex items-center justify-center text-2xl mx-auto mb-5">🔐</div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center tracking-tight">Set new password</h2>
            <p className="text-slate-500 text-sm mb-8 text-center font-medium">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">New Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Confirm Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className={`${inputClass} pl-12`}
                  />
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 rounded-full shadow-glow flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest mt-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle size={16} /> Reset Password</>
                }
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
