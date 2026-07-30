import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Link2, ArrowRight, Plane, Copy, Check, Upload, RefreshCw, History, CheckCircle } from 'lucide-react';
import { tripApi } from '../api';
import { GlassCard, Spinner } from '../components/ui/index';
import toast from 'react-hot-toast';

export default function JoinTripManualPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [recentInvites, setRecentInvites] = useState([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState(null);
  const navigate = useNavigate();

  // Load history on mount
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('recent_invites') || '[]');
    setRecentInvites(history);
  }, []);

  const mutation = useMutation({
    mutationFn: (joinCode) => tripApi.join(joinCode),
    onSuccess: (res) => {
      const trip = res.data.trip;
      toast.success(`Joined "${trip.name}"! 🎉`);
      
      // Update history in localStorage
      const newHistory = [
        { id: trip._id, name: trip.name, destination: trip.destination, code: trip.inviteCode },
        ...recentInvites.filter(x => x.id !== trip._id)
      ].slice(0, 5); // keep last 5
      localStorage.setItem('recent_invites', JSON.stringify(newHistory));
      setRecentInvites(newHistory);

      // Trigger full-screen success animation before navigate
      setShowSuccessScreen(trip);
      setTimeout(() => {
        navigate(`/trips/${trip._id}`);
      }, 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Invalid or expired invite code');
      toast.error('Could not join trip. Please check invite code.');
    },
  });

  const parseInviteCode = (value) => {
    const trimmed = value.trim();
    const joinMatch = trimmed.match(/\/join\/([A-Za-z0-9_-]+)/i);
    if (joinMatch && joinMatch[1]) {
      return joinMatch[1].toUpperCase();
    }
    try {
      if (trimmed.startsWith('http') || trimmed.includes('/')) {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get('code') || url.searchParams.get('invite');
        if (codeParam) return codeParam.toUpperCase();
        
        const paths = url.pathname.split('/').filter(Boolean);
        if (paths.length > 0) return paths[paths.length - 1].toUpperCase();
      }
    } catch(e) { }

    return trimmed.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  };

  const handleInputChange = (e) => {
    const parsed = parseInviteCode(e.target.value);
    setCode(parsed);
    setError('');
  };

  const handleJoin = (joinCode = code) => {
    if (!joinCode) return;
    if (joinCode.length < 4 || joinCode.length > 32) {
      setError('Invite code must be between 4 and 32 characters');
      return;
    }
    setError('');
    mutation.mutate(joinCode);
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    toast.success('Analyzing screenshot for invite details...');
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m.status) }
      );
      
      const parsedCode = parseInviteCode(text);
      const codeMatch = text.match(/code[:\s]+([A-Z0-9_-]{6,16})/i) || text.match(/\/join\/([A-Z0-9_-]{6,16})/i) || text.match(/\b([A-Z0-9_-]{12})\b/i);
      
      if (codeMatch && codeMatch[1]) {
        const codeValue = codeMatch[1].toUpperCase();
        setCode(codeValue);
        toast.success(`Extracted Invite Code: ${codeValue} 🎉`);
        handleJoin(codeValue);
      } else if (parsedCode && parsedCode.length >= 6 && parsedCode.length <= 16) {
        setCode(parsedCode);
        toast.success(`Extracted Code: ${parsedCode}`);
        handleJoin(parsedCode);
      } else {
        toast.error("Could not find a valid invite code in screenshot text. Please type manually.");
      }
    } catch (err) {
      toast.error("Failed to perform scanner check on this image.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto space-y-8 pb-12 px-4 relative">
      
      {/* Background Decorative Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-0 w-64 h-64 bg-primary-200 rounded-full blur-[80px] opacity-30" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-secondary-200 rounded-full blur-[80px] opacity-30" />
      </div>

      {/* Join Animation Overlay */}
      <AnimatePresence>
        {showSuccessScreen && (
          <motion.div 
            className="fixed inset-0 bg-white/80 backdrop-blur-2xl flex flex-col items-center justify-center z-50 p-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="space-y-6 flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center border-2 border-success/20 text-success shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <CheckCircle size={48} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Successfully Joined!</h2>
                <p className="text-primary-600 font-bold text-xl">"{showSuccessScreen.name}"</p>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-3">Destination: {showSuccessScreen.destination}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="text-center pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-glow border border-white/40 select-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 -translate-y-1/2 translate-x-1/4" />
          <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">✈️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-3">Join a Trip</h1>
        <p className="text-slate-500 text-sm font-medium">Enter a travel folder invite code to connect</p>
      </motion.div>

      <GlassCard className="!p-8 border-white/60 bg-white/70 backdrop-blur-[30px] shadow-sm rounded-[32px]">
        <div className="space-y-8">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 text-center">Invite Code / URL</label>
            <input
              value={code}
              onChange={handleInputChange}
              placeholder="ENTER CODE OR LINK"
              className="w-full glass-sm bg-white/80 border-white/80 focus:border-white focus:bg-white px-5 py-4 text-center font-mono tracking-[0.2em] text-primary-600 text-lg font-bold placeholder:text-slate-300 rounded-[20px] transition-all shadow-inner-sm uppercase"
              onKeyDown={e => e.key === 'Enter' && code && handleJoin()}
            />
            {error ? (
              <p className="text-danger text-[11px] mt-3 text-center font-bold uppercase tracking-wider">{error}</p>
            ) : (
              <p className="text-slate-400 text-[10px] mt-3 text-center font-medium">Paste the full HTTP link or the 12-char code</p>
            )}
          </div>

          <motion.button
            onClick={() => handleJoin()}
            disabled={!code.trim() || mutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full shadow-glow disabled:opacity-50 disabled:shadow-none"
            whileHover={{ scale: code.trim() && !mutation.isPending ? 1.02 : 1 }}
            whileTap={{ scale: code.trim() && !mutation.isPending ? 0.98 : 1 }}
          >
            {mutation.isPending ? <Spinner size="sm" className="border-white" /> : (
              <span className="flex items-center justify-center gap-2 text-[12px] tracking-widest font-bold uppercase">
                Connect Trip <ArrowRight size={16} className="stroke-[2.5]" />
              </span>
            )}
          </motion.button>
        </div>
      </GlassCard>

      {/* Divider */}
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex-1 h-px bg-slate-200/60" />
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">or scan</span>
        <div className="flex-1 h-px bg-slate-200/60" />
      </div>

      {/* Scan QR Receipt */}
      <GlassCard className="!p-8 text-center space-y-6 border-white/60 bg-white/70 backdrop-blur-[30px] shadow-sm rounded-[32px] overflow-hidden">
        <div className="w-16 h-16 bg-primary-50 rounded-[20px] flex items-center justify-center mx-auto shadow-sm">
          <QrCode size={24} className="text-primary-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wider mb-2">Upload Invite Screenshot</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed font-medium px-4">
            Take a screenshot of the Trip QR Code and upload it. We'll automatically extract the details.
          </p>
        </div>

        <div className="relative border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-[24px] p-6 text-center cursor-pointer transition-colors duration-300 bg-slate-50/50 hover:bg-primary-50/50 group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleQrUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          />
          <div className="flex flex-col items-center gap-3">
            {scanning ? (
              <>
                <RefreshCw size={24} className="text-primary-500 animate-spin" />
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">Scanning screenshot...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">Drop or browse invite card</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 glass-sm rounded-[16px] border-white/80 bg-white/50 shadow-sm">
          <Link2 size={16} className="text-slate-400 flex-shrink-0 stroke-[2.5]" />
          <p className="text-slate-500 text-[10px] font-bold flex-1 text-left uppercase tracking-wider">
            Copy-pasting the invite link will extract the code automatically
          </p>
        </div>
      </GlassCard>

      {/* Recent invitations history */}
      {recentInvites.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-slate-400 px-4 mb-4">
            <History size={14} className="stroke-[2.5]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Recent Invitations</h3>
          </div>
          <div className="space-y-3">
            {recentInvites.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleJoin(item.code)}
                className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border border-white/80 rounded-[20px] hover:bg-white hover:shadow-float cursor-pointer transition-all duration-300 shadow-sm group"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-slate-800 text-[13px] font-extrabold truncate group-hover:text-primary-600 transition-colors">{item.name}</p>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">{item.destination}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-primary-500 bg-primary-50 px-2 py-1 rounded-lg font-mono text-[10px] font-bold tracking-widest uppercase">{item.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
