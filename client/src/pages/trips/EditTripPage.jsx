import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, MapPin, Calendar, DollarSign, Tag, Check, Save } from 'lucide-react';
import { tripApi } from '../../api';
import { GlassCard, Spinner } from '../../components/ui/index';
import { CURRENCIES } from '../../utils/currency';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'cancelled'];
const inputClass = 'w-full bg-white/50 border border-white/80 focus:border-primary-300 focus:bg-white/90 px-5 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[16px] transition-all shadow-sm outline-none';

export default function EditTripPage() {
  const { id: routeId, tripId } = useParams();
  const id = tripId || routeId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripApi.getOne(id).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (data?.trip) {
      const t = data.trip;
      reset({
        name: t.name, destination: t.destination, description: t.description || '',
        budget: t.budget || '', currency: t.currency || 'INR',
        startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
        endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
        status: t.status, tags: t.tags?.join(', ') || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData) => {
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return tripApi.update(id, { ...formData, budget: parseFloat(formData.budget) || 0, tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', id]);
      queryClient.invalidateQueries(['trips']);
      toast.success('Trip updated successfully!');
      navigate(`/trips/${id}`);
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  });

  if (isLoading) return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 px-2 sm:px-4">
      <motion.button
        onClick={() => navigate(`/trips/${id}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-primary-500 text-[12px] font-bold uppercase tracking-wider transition-colors"
        whileHover={{ x: -3 }}
      >
        <ArrowLeft size={16} /> Back to Trip
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-[16px] flex items-center justify-center shadow-glow">
          <Edit3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Edit Trip</h1>
          <p className="text-slate-500 text-[12px] font-bold uppercase tracking-widest mt-0.5">Modify trip settings and preferences</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <GlassCard className="!p-8 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[32px] space-y-6">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Trip Name *</label>
            <input {...register('name', { required: true })} className={inputClass} placeholder="Summer Vacation 2026" />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Destination *</label>
            <div className="relative group">
              <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input {...register('destination', { required: true })} className={`${inputClass} pl-12`} placeholder="Paris, France" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
            <textarea {...register('description')} rows={3} className={`${inputClass} resize-none`} placeholder="Trip details and notes..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
              <div className="relative group">
                <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input {...register('startDate')} type="date" className={`${inputClass} pl-12`} />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
              <div className="relative group">
                <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input {...register('endDate')} type="date" className={`${inputClass} pl-12`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Budget</label>
              <div className="relative group">
                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input {...register('budget', { valueAsNumber: true })} type="number" className={`${inputClass} pl-12`} placeholder="50000" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Currency</label>
              <select {...register('currency')} className={`${inputClass} appearance-none cursor-pointer`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Status</label>
            <select {...register('status')} className={`${inputClass} appearance-none cursor-pointer`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Tags (comma separated)</label>
            <div className="relative group">
              <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input {...register('tags')} className={`${inputClass} pl-12`} placeholder="beach, adventure, summer" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200/60">
            <button type="button" onClick={() => navigate(`/trips/${id}`)} className="btn-secondary rounded-full py-4 px-8 font-bold tracking-wide shadow-sm w-full sm:flex-1">
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary rounded-full py-4 px-8 font-bold tracking-wide shadow-glow flex items-center justify-center gap-2 w-full sm:flex-[2] text-[13px] uppercase tracking-widest"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {mutation.isPending ? <Spinner size="sm" className="border-white" /> : <><Save size={16} /> Save Changes</>}
            </motion.button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
