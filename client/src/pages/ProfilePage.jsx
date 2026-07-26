import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Edit2, Camera, Save, X, Lock, Eye, EyeOff, MapPin, Building,
  Phone, CreditCard, Award, Map, Compass, Shield, Smartphone, ChevronDown,
  Plane, Globe, Wallet, ArrowUpFromLine, ArrowDownToLine, ShieldCheck,
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
  const uniqueDestinations = [...new Set(trips.map(t => t.destination?.split(',').pop().trim()).filter(Boolean))];
  const countriesVisited = uniqueDestinations.length || (totalTrips > 0 ? 1 : 0);

  const badges = [
    { name: 'Globetrotter', desc: 'Visited multiple destinations', active: countriesVisited >= 2, icon: Map, color: 'from-blue-500 to-cyan-500' },
    { name: 'Saver Pro', desc: 'Saved over ₹500 via splitting', active: moneySaved > 500, icon: Compass, color: 'from-emerald-500 to-green-500' },
    { name: 'Squad Leader', desc: 'Created a trip folder', active: (stats?.tripsCreated || 0) > 0, icon: Award, color: 'from-[#6D4AFF] to-[#8B5CF6]' },
    { name: 'Verified Member', desc: 'Profile setup completed', active: true, icon: Shield, color: 'from-amber-500 to-orange-500' },
  ];

  const preferredApp = UPI_APPS.find(a => a.value === user?.preferredUpiApp);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 px-2 sm:px-4 text-[#1E1B4B]">
      {/* Profile Header */}
      <motion.div
        className="bg-white border border-[#E9E2FF] rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#6D4AFF]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Photo */}
          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            <Avatar src={user?.photo} name={user?.fullName} size="2xl" className="ring-4 ring-[#EDE8FF]" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-[#6D4AFF] rounded-full flex-center hover:bg-[#5A38E8] transition-colors shadow-lg border border-white/10"
            >
              {photoMutation.isPending ? <Spinner size="sm" /> : <Camera size={14} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1E1B4B] tracking-tight">{user?.fullName}</h1>
                <p className="text-[#6D4AFF] text-xs font-bold uppercase tracking-wider mt-1">@{user?.username}</p>
                {user?.bio && <p className="text-[#6B5CA5] text-sm mt-2.5 max-w-md leading-relaxed">{user.bio}</p>}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-[#6B5CA5] text-xs">
                  {user?.city && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#6D4AFF]" /> {user.city}</span>}
                  {user?.company && <span className="flex items-center gap-1.5"><Building size={12} className="text-[#6D4AFF]" /> {user.company}</span>}
                  {user?.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-[#6D4AFF]" /> {user.phone}</span>}
                </div>
                {/* UPI Info Banner */}
                {user?.upiId && (
                  <div className="mt-4 inline-flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
                    <CreditCard size={13} className="text-emerald-700" />
                    <div>
                      <p className="text-emerald-750 text-xs font-bold">{user.upiId}</p>
                      {user.upiAccountName && <p className="text-[#6B5CA5] text-[10px] mt-0.5">{user.upiAccountName}</p>}
                    </div>
                    {preferredApp && (
                      <Badge variant="success" className="text-[10px] ml-1">{preferredApp.label}</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-center mt-2 sm:mt-0 flex-shrink-0">
                <button
                  onClick={() => { setEditing(!editing); reset(user); }}
                  className={clsx(
                    'btn text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-300',
                    editing
                      ? 'bg-[#F3F0FF] border border-[#E9E2FF] text-[#6D4AFF] hover:bg-[#EDE8FF]'
                      : 'border border-[#E9E2FF] bg-white text-[#6B5CA5] hover:bg-[#F3F0FF] hover:text-[#6D4AFF]'
                  )}
                >
                  {editing ? <><X size={13} /> Cancel</> : <><Edit2 size={13} /> Edit Profile</>}
                </button>
                {!passwordMode && (
                  <button
                    onClick={() => setPasswordMode(true)}
                    className="btn text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#E9E2FF] bg-white text-[#6B5CA5] hover:bg-[#F3F0FF] hover:text-[#6D4AFF]"
                  >
                    <Lock size={13} /> Password
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Form */}
      {editing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <GlassCard className="border-[#E9E2FF] bg-white">
            <h2 className="text-sm font-bold text-[#1E1B4B] mb-6">Edit Profile</h2>
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('fullName', { required: true })} className="input bg-white border-[#E9E2FF]" />
                </div>
                <div>
                  <label className="label">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] text-xs font-bold">@</span>
                    <input {...register('username')} className="input pl-8 bg-white border-[#E9E2FF]" />
                  </div>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                    <input {...register('phone')} className="input pl-10 bg-white border-[#E9E2FF]" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="label">City</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                    <input {...register('city')} className="input pl-10 bg-white border-[#E9E2FF]" placeholder="Mumbai" />
                  </div>
                </div>
                <div>
                  <label className="label">Company / Affiliation</label>
                  <div className="relative">
                    <Building size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                    <input {...register('company')} className="input pl-10 bg-white border-[#E9E2FF]" placeholder="Google / IIT Bombay" />
                  </div>
                </div>
                <div>
                  <label className="label">UPI ID</label>
                  <div className="relative">
                    <CreditCard size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                    <input {...register('upiId')} className="input pl-10 bg-white border-[#E9E2FF]" placeholder="yourname@upi" />
                  </div>
                </div>
                <div>
                  <label className="label">Account Holder Name (UPI)</label>
                  <input {...register('upiAccountName')} className="input bg-white border-[#E9E2FF]" placeholder="As shown in UPI app" />
                </div>
                <div>
                  <label className="label">Preferred UPI App</label>
                  <div className="relative">
                    <Smartphone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                    <select {...register('preferredUpiApp')} className="input pl-10 bg-white border-[#E9E2FF] appearance-none">
                      <option value="">Select UPI App</option>
                      {UPI_APPS.map(app => (
                        <option key={app.value} value={app.value}>{app.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Bio</label>
                  <textarea {...register('bio')} rows={2} className="input resize-none bg-white border-[#E9E2FF]" placeholder="A short bio about yourself..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-outline btn flex-1 py-3 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary btn flex-1 gap-2 py-3 text-sm font-semibold rounded-xl shadow-glow-sm">
                  {updateMutation.isPending ? <Spinner size="sm" /> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Change Password */}
      {passwordMode && (
        <GlassCard className="border-[#E9E2FF] bg-white">
          <h2 className="text-sm font-bold text-[#1E1B4B] mb-6">Change Password</h2>
          <form onSubmit={pwSubmit(d => pwMutation.mutate(d))} className="space-y-5">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                <input {...pwReg('currentPassword', { required: true })} type={showPass ? 'text' : 'password'} className="input pl-10 pr-11 bg-white border-[#E9E2FF]" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5CA5] hover:text-[#1E1B4B] transition-colors">
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5CA5]" />
                <input {...pwReg('newPassword', { required: true, minLength: { value: 6, message: 'Minimum 6 characters' } })} type={showPass ? 'text' : 'password'} className="input pl-10 bg-white border-[#E9E2FF]" />
              </div>
              {pwErrors.newPassword && <p className="text-red-400 text-xs mt-1.5 font-medium">{pwErrors.newPassword.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPasswordMode(false)} className="btn-outline btn flex-1 py-3 text-sm font-semibold rounded-xl">Cancel</button>
              <button type="submit" disabled={pwMutation.isPending} className="btn-primary btn flex-1 py-3 text-sm font-semibold rounded-xl shadow-glow-sm">
                {pwMutation.isPending ? <Spinner size="sm" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Plane size={16} className="text-white" />} label="Trips Configured" value={totalTrips} gradient="from-[#6D4AFF] to-[#8B5CF6]" />
        <StatCard icon={<Globe size={16} className="text-white" />} label="Destinations" value={countriesVisited} gradient="from-[#8B5CF6] to-[#A855F7]" />
        <StatCard icon={<Wallet size={16} className="text-white" />} label="Total Spent" value={`₹${formatCurrency(totalPaid)}`} gradient="from-[#22C55E] to-[#15803D]" />
        <StatCard icon={<ArrowUpFromLine size={16} className="text-white" />} label="Amount Owed" value={`₹${formatCurrency(stats?.totalOwed || 0)}`} gradient="from-rose-500 to-pink-500" />
        <StatCard icon={<ArrowDownToLine size={16} className="text-white" />} label="To Receive" value={`₹${formatCurrency(stats?.totalToReceive || 0)}`} gradient="from-amber-500 to-orange-500" />
        <StatCard icon={<ShieldCheck size={16} className="text-white" />} label="Est. Savings" value={`₹${formatCurrency(moneySaved)}`} gradient="from-rose-550 to-pink-550" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges / Achievements */}
        <GlassCard className="border-[#E9E2FF] bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D4AFF]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-sm font-bold text-[#1E1B4B] mb-5">Travel Milestones</h2>
          <div className="space-y-3">
            {badges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className={clsx(
                    'flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300',
                    badge.active ? 'bg-[#F8F5FF] border-[#E9E2FF]' : 'bg-[#F8F5FF]/40 border-[#E9E2FF]/40 opacity-40'
                  )}
                >
                  <div className={clsx(
                    'w-9 h-9 rounded-xl flex-center text-white border border-white/10 bg-gradient-to-br flex-shrink-0',
                    badge.active ? badge.color : 'from-[#F3F0FF] to-[#E9E2FF] text-[#6B5CA5]'
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#1E1B4B] text-sm font-bold">{badge.name}</h4>
                    <p className="text-[#6B5CA5] text-xs mt-0.5">{badge.desc}</p>
                  </div>
                  {badge.active && <Badge variant="success" className="text-[10px] flex-shrink-0">Unlocked</Badge>}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Travel history */}
        <GlassCard className="border-[#E9E2FF] bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-sm font-bold text-[#1E1B4B] mb-5">Travel History</h2>
          {!trips.length ? (
            <EmptyState
              icon={<MapPin size={28} className="text-[#6D4AFF]" />}
              title="No travel history"
            />
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
              {trips.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3.5 bg-[#F8F5FF] border border-[#E9E2FF] rounded-2xl hover:border-[#D0C6FF] transition-colors duration-300"
                >
                  <div className="min-w-0">
                    <p className="text-[#1E1B4B] text-sm font-bold truncate">{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#6B5CA5] text-xs">
                      <MapPin size={10} className="text-[#6D4AFF]" />
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <Badge variant={t.status === 'completed' ? 'gray' : 'success'} className="flex-shrink-0 ml-3">
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
