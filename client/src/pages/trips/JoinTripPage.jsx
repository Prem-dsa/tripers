import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plane, MapPin } from 'lucide-react';
import { tripApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Spinner, GlassCard } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function JoinTripPage() {
  const { inviteCode } = useParams();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => tripApi.join(inviteCode),
    onSuccess: (res) => {
      toast.success(`Joined "${res.data.trip.name}" successfully!`);
      navigate(`/trips/${res.data.trip._id}`);
    },
    onError: err => {
      toast.error(err.response?.data?.message || 'Invalid invite code');
      navigate('/trips');
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingInvite', inviteCode);
      navigate('/login');
      return;
    }
    mutation.mutate();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      {/* Background Decorative Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[500px] h-[500px] bg-primary-200 rounded-full blur-[100px] opacity-20 -translate-x-1/2 -translate-y-1/4" />
        <div className="absolute w-[400px] h-[400px] bg-secondary-200 rounded-full blur-[100px] opacity-20 translate-x-1/3 translate-y-1/4" />
      </div>

      <motion.div
        className="text-center w-full max-w-sm z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <GlassCard className="!p-10 flex flex-col items-center bg-white/70 backdrop-blur-[40px] border-white/80 shadow-float rounded-[40px]">
          {/* Icon */}
          <motion.div
            className="w-24 h-24 mb-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-[28px] flex items-center justify-center shadow-glow relative overflow-hidden"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 -translate-y-1/2 translate-x-1/4" />
            <Plane size={40} className="text-white relative z-10 stroke-[1.5]" />
          </motion.div>

          <div className="space-y-3 mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Joining Trip</h2>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-[13px] bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100">
              <MapPin size={16} className="text-primary-500" />
              <span className="font-medium">Invite Code:</span>
              <span className="text-primary-600 font-mono font-bold tracking-widest bg-primary-50 px-2 py-0.5 rounded-lg">{inviteCode}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 w-full bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
            <Spinner size="lg" className="border-primary-500" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Processing Access...</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
