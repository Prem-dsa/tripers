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
  const [showSuccessScreen, setShowSuccessScreen] = useState(null); // stores joined trip name if successful
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

  // Bugfix: Parse and clean full invite codes/URLs
  const parseInviteCode = (value) => {
    const trimmed = value.trim();
    // 1. Extract from standard URL segment /join/CODE
    const joinMatch = trimmed.match(/\/join\/([A-Za-z0-9_-]+)/i);
    if (joinMatch && joinMatch[1]) {
      return joinMatch[1].toUpperCase();
    }
    // 2. Extract from URL query parameter ?code=CODE
    try {
      if (trimmed.startsWith('http') || trimmed.includes('/')) {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get('code') || url.searchParams.get('invite');
        if (codeParam) return codeParam.toUpperCase();
        
        // Otherwise grab last path segment
        const paths = url.pathname.split('/').filter(Boolean);
        if (paths.length > 0) return paths[paths.length - 1].toUpperCase();
      }
    } catch(e) { }

    // 3. Fallback: Clean formatting, remove symbols, force uppercase
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

  // OCR QR/Invite Code extraction using Tesseract
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
      // Scan for code match (specifically searching for code patterns)
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
      toast.error("Failed to perform OCR scanner check on this image.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12 px-2">
      {/* Join Animation Overlay */}
      <AnimatePresence>
        {showSuccessScreen && (
          <motion.div 
            className="fixed inset-0 bg-dark-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex-center mx-auto border border-green-500/20 text-green-400 mb-6 shadow-glow-success">
                <CheckCircle size={40} className="stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">Successfully Joined!</h2>
              <p className="text-primary-300 font-extrabold text-lg capitalize">"{showSuccessScreen.name}"</p>
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider">Destination: {showSuccessScreen.destination}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="text-center py-4"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex-center text-3xl mx-auto mb-4 shadow-[0_4px_16px_rgba(124,92,255,0.35)] border border-white/10 select-none">
          ✈️
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">Join a Trip</h1>
        <p className="text-dark-400 text-xs font-bold uppercase tracking-wider mt-1.5">Enter a travel folder invite code to connect</p>
      </motion.div>

      <GlassCard className="border-white/8 bg-dark-900/35 backdrop-blur-2xl">
        <div className="space-y-6">
          <div>
            <label className="label text-[9px] tracking-wider mb-2">Invite Code / URL</label>
            <input
              value={code}
              onChange={handleInputChange}
              placeholder="ENTER CODE OR PASTE LINK"
              className="input input-lg font-mono text-center tracking-[0.15em] text-primary-400 text-base uppercase bg-dark-950/30 border-white/5 focus:border-primary-400"
              onKeyDown={e => e.key === 'Enter' && code && handleJoin()}
            />
            {error ? (
              <p className="text-red-400 text-[10px] mt-2.5 text-center font-bold uppercase tracking-wider">{error}</p>
            ) : (
              <p className="text-dark-500 text-[9px] mt-2 text-center font-bold uppercase tracking-wider">Paste the full HTTP link or the 12-char code</p>
            )}
          </div>

          <button
            onClick={() => handleJoin()}
            disabled={!code.trim() || mutation.isPending}
            className="btn-primary btn w-full gap-2 py-3.5 rounded-xl transition-all duration-300 shadow-glow"
          >
            {mutation.isPending ? <Spinner size="sm" /> : (
              <span className="flex items-center justify-center gap-1.5 text-[10px] tracking-wider font-bold uppercase">
                Connect Trip <ArrowRight size={13} className="stroke-[2.5]" />
              </span>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Divider */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-dark-450 text-[9px] font-bold uppercase tracking-widest">or scan card</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Scan QR Receipt */}
      <GlassCard className="text-center space-y-4 border-white/5 bg-dark-900/35 backdrop-blur-2xl relative overflow-hidden">
        <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex-center mx-auto border border-primary-500/20 shadow-sm">
          <QrCode size={18} className="text-primary-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">Upload Invite Card Screenshot</h3>
          <p className="text-dark-400 text-[10px] leading-relaxed mt-1 font-medium">
            Take a screenshot of the Trip QR Code / Invite and drag it below. OCR automatically extracts details.
          </p>
        </div>

        <div className="relative border border-dashed border-white/10 hover:border-primary-400/50 rounded-xl p-5 text-center cursor-pointer transition-colors duration-300 bg-dark-950/10">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleQrUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
          <div className="flex flex-col items-center gap-2">
            {scanning ? (
              <>
                <RefreshCw size={20} className="text-primary-400 animate-spin" />
                <p className="text-white text-[10px] font-bold uppercase tracking-wider">Scanning screenshot text...</p>
              </>
            ) : (
              <>
                <Upload size={18} className="text-dark-400" />
                <p className="text-white text-[10px] font-bold uppercase tracking-wider">Drop or browse invite card</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 glass-sm rounded-xl border-white/5 bg-dark-950/30">
          <Link2 size={13} className="text-dark-450 flex-shrink-0" />
          <p className="text-dark-450 text-[9px] font-semibold truncate flex-1 text-left uppercase tracking-wider">
            Copy-pasting the invite link will extract the code automatically
          </p>
        </div>
      </GlassCard>

      {/* Recent invitations history */}
      {recentInvites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-dark-400 px-1 border-b border-white/5 pb-2.5">
            <History size={12} />
            <h3 className="text-[9px] font-bold uppercase tracking-widest">Recent Invitations</h3>
          </div>
          <div className="space-y-2">
            {recentInvites.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleJoin(item.code)}
                className="flex items-center justify-between p-3.5 bg-dark-900/20 border border-white/5 rounded-xl hover:border-primary-400/30 cursor-pointer transition-colors duration-300"
              >
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate leading-none">{item.name}</p>
                  <p className="text-dark-400 text-[8px] font-bold uppercase tracking-widest mt-1.5">{item.destination}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-primary-300 font-mono text-[9px] font-bold uppercase tracking-wider">{item.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
