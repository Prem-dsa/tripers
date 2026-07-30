import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Camera, Save, X, Lock, Eye, EyeOff, MapPin, Building,
  Phone, CreditCard, Award, Map, Compass, Shield, Smartphone, ChevronDown,
  Plane, Globe, Wallet, ArrowUpFromLine, ArrowDownToLine, ShieldCheck, Sparkles, UserCheck
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { userApi, tripApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { GlassCard, StatCard, Avatar, Spinner, Badge, EmptyState } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const UPI_APPS = [
  { value: 'google_pay', label: 'Google Pay' },
  { value: 'phonepe', label: 'PhonePe' },
  { value: 'paytm', label: 'Paytm' },
  { value: 'bhim', label: 'BHIM' },
  { value: 'amazon_pay', label: 'Amazon Pay' },
  { value: 'cred', label: 'Cred UPI' },
];

const darkInputStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '16px',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#f1f5f9',
  outline: 'none',
  width: '100%',
  minHeight: '48px',
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const fileRef = useRef();

  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data),
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: user || {} });
  const { register: pwReg, handleSubmit: pwSubmit, formState: { errors: pwErrors }, reset: pwReset } = useForm();

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (res) => {
      setUser(res.data.user);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Profile updated successfully!');
      setEditing(false);
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const photoMutation = useMutation({
    mutationFn: (fd) => userApi.uploadPhoto(fd),
    onSuccess: (res) => {
      setUser({ ...user, photo: res.data.photo });
      toast.success('Photo updated successfully!');
    },
    onError: () => toast.error('Photo upload failed'),
  });

  const pwMutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => { toast.success('Password updated!'); setPasswordMode(false); pwReset(); },
    onError: err => toast.error(err.response?.data?.message || 'Password update failed.'),
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    photoMutation.mutate(fd);
  };

  const stats = dashData?.stats;
  const trips = tripsData?.trips || [];

  const totalTrips = (stats?.tripsCreated || 0) + (stats?.tripsJoined || 0);
  const totalPaid = stats?.totalPaid || 0;
  const moneySaved = Math.round(totalPaid * 0.12);
  const uniqueDestinations = [...new Set(trips.map(t => t.destination?.split(',').pop()?.trim()).filter(Boolean))];
  const countriesVisited = uniqueDestinations.length || (totalTrips > 0 ? 1 : 0);

  const badges = [
    { name: 'Globetrotter', desc: 'Visited multiple destinations', active: countriesVisited >= 2, icon: Map, color: 'from-indigo-500 to-purple-500' },
    { name: 'Saver Pro', desc: 'Saved over ₹500 via splitting', active: moneySaved > 500, icon: Compass, color: 'from-emerald-400 to-teal-500' },
    { name: 'Squad Leader', desc: 'Created a trip folder', active: (stats?.tripsCreated || 0) > 0, icon: Award, color: 'from-purple-500 to-pink-500' },
    { name: 'Verified Member', desc: 'Profile setup completed', active: true, icon: Shield, color: 'from-amber-400 to-orange-500' },
  ];

  const preferredApp = UPI_APPS.find(a => a.value === user?.preferredUpiApp);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 text-white">
      {/* Profile Banner */}
      <motion.div
        className="glass overflow-hidden relative shadow-2xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cover Gradient */}
        <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-white/20 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute bottom-4 right-4 sm:right-6 bg-black/40 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest">
            Level 5 Traveler
          </div>
        </div>

        <div className="p-4 sm:p-8 -mt-14 sm:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-end">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar src={user?.photo} name={user?.fullName} size="2xl" className="ring-4 ring-slate-900 shadow-2xl rounded-[28px]" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 min-h-[40px] min-w-[40px] bg-indigo-500 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-glow border-2 border-slate-950"
                title="Change Photo"
              >
                {photoMutation.isPending ? <Spinner size="sm" /> : <Camera size={16} className="text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{user?.fullName}</h1>
                  <p className="text-indigo-400 text-[11px] font-bold uppercase tracking-widest mt-1">@{user?.username}</p>
                  {user?.bio && <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md leading-relaxed font-medium">{user.bio}</p>}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 text-slate-300 text-[11px] font-medium">
                    {user?.city && <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15"><MapPin size={11} className="text-indigo-400" /> {user.city}</span>}
                    {user?.company && <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15"><Building size={11} className="text-purple-400" /> {user.company}</span>}
                    {user?.phone && <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15"><Phone size={11} className="text-pink-400" /> {user.phone}</span>}
                  </div>

                  {/* UPI Badge */}
                  {user?.upiId && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-[14px] px-3.5 py-2">
                      <CreditCard size={13} className="text-emerald-400" />
                      <div>
                        <p className="text-emerald-300 text-[11px] font-bold">{user.upiId}</p>
                        {user.upiAccountName && <p className="text-slate-400 text-[9px] font-medium">{user.upiAccountName}</p>}
                      </div>
                      {preferredApp && (
                        <Badge variant="success" className="text-[9px] ml-1">{preferredApp.label}</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center mt-2 sm:mt-0 flex-shrink-0">
                  <motion.button
                    onClick={() => { setEditing(!editing); reset(user); }}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 uppercase tracking-wider min-h-[44px]"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {editing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
                  </motion.button>
                  {!passwordMode && (
                    <motion.button
                      onClick={() => setPasswordMode(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 uppercase tracking-wider min-h-[44px]"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Lock size={14} /> Password
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Form */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="!p-5 sm:!p-8">
              <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/10 pb-3 mb-5">Edit Profile</h2>
              <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                    <input {...register('fullName', { required: true })} style={darkInputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</span>
                      <input {...register('username')} style={{ ...darkInputStyle, paddingLeft: '36px' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Phone</label>
                    <input {...register('phone')} style={darkInputStyle} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">City</label>
                    <input {...register('city')} style={darkInputStyle} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Company / Affiliation</label>
                    <input {...register('company')} style={darkInputStyle} placeholder="Google / IIT Bombay" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">UPI ID</label>
                    <input {...register('upiId')} style={darkInputStyle} placeholder="yourname@upi" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Account Holder Name (UPI)</label>
                    <input {...register('upiAccountName')} style={darkInputStyle} placeholder="As shown in UPI app" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Preferred UPI App</label>
                    <select {...register('preferredUpiApp')} style={darkInputStyle} className="cursor-pointer">
                      <option value="" style={{ background: '#1e293b' }}>Select App</option>
                      {UPI_APPS.map(a => (
                        <option key={a.value} value={a.value} style={{ background: '#1e293b' }}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Bio</label>
                  <textarea {...register('bio')} rows={3} style={{ ...darkInputStyle, height: 'auto' }} placeholder="Tell fellow travelers about yourself..." />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary rounded-full py-2.5 px-6 text-xs font-bold min-h-[44px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateMutation.isPending} className="btn-primary rounded-full py-2.5 px-6 text-xs font-bold uppercase tracking-wider shadow-glow min-h-[44px]">
                    {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Change Form */}
      <AnimatePresence>
        {passwordMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="!p-5 sm:!p-8">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-5">
                <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Change Password</h2>
                <button onClick={() => setPasswordMode(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>

              <form onSubmit={pwSubmit(d => pwMutation.mutate(d))} className="space-y-4 max-w-md">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Current Password</label>
                  <input type="password" {...pwReg('currentPassword', { required: true })} style={darkInputStyle} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">New Password</label>
                  <input type="password" {...pwReg('newPassword', { required: true, minLength: 6 })} style={darkInputStyle} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setPasswordMode(false)} className="btn-secondary rounded-full py-2.5 px-6 text-xs font-bold min-h-[44px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={pwMutation.isPending} className="btn-primary rounded-full py-2.5 px-6 text-xs font-bold uppercase tracking-wider shadow-glow min-h-[44px]">
                    {pwMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Plane size={18} className="text-white stroke-[2.5]" />} label="Total Trips" value={totalTrips} gradient="from-indigo-500 to-purple-500" />
        <StatCard icon={<Wallet size={18} className="text-white stroke-[2.5]" />} label="Total Spent" value={`₹${formatCurrency(totalPaid)}`} gradient="from-purple-500 to-pink-500" />
        <StatCard icon={<Compass size={18} className="text-white stroke-[2.5]" />} label="Saved" value={`₹${formatCurrency(moneySaved)}`} sub="Estimated savings" gradient="from-emerald-400 to-teal-500" />
        <StatCard icon={<Globe size={18} className="text-white stroke-[2.5]" />} label="Destinations" value={countriesVisited} gradient="from-amber-400 to-orange-500" />
      </div>

      {/* Badges Grid */}
      <GlassCard>
        <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.18em] mb-4">Travel Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.name}
                className={clsx(
                  'p-4 rounded-[20px] border flex flex-col justify-between transition-all',
                  b.active ? 'bg-white/8 border-white/20' : 'bg-white/4 border-white/8 opacity-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${b.color} flex items-center justify-center text-white shadow-glow flex-shrink-0`}>
                    <Icon size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[13px]">{b.name}</p>
                    <p className="text-slate-400 text-[10px] font-medium mt-0.5">{b.desc}</p>
                  </div>
                </div>
                {b.active && (
                  <Badge variant="success" className="mt-3 text-[8px] self-start">Unlocked</Badge>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
