import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plane, MapPin } from 'lucide-react';
import { tripApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui/index';
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        className="text-center space-y-6 max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Icon */}
        <motion.div
          className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Plane size={32} className="text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Joining Trip...</h2>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <MapPin size={14} className="text-primary-400" />
            <span>Invite Code:</span>
            <span className="text-primary-400 font-mono font-bold">{inviteCode}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Spinner size="md" />
          <span className="text-gray-400 text-sm">Processing invite...</span>
        </div>
      </motion.div>
    </div>
  );
}
