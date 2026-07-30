import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, Image as ImageIcon, X, ArrowLeft, Upload, Info, Plane } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { clsx } from 'clsx';
import { tripApi } from '../../api';
import { GlassCard, Spinner, Badge } from '../../components/ui/index';
import { CURRENCIES } from '../../utils/currency';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name too short').max(100),
  destination: z.string().min(2, 'Destination required'),
  description: z.string().optional(),
  budget: z.number().min(0).optional().or(z.literal('')),
  currency: z.string().default('INR'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.string().optional(),
});

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'INR' },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const tripRes = await tripApi.create({ ...data, budget: parseFloat(data.budget) || 0, tags });
      const tripId = tripRes.data.trip._id;

      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        await tripApi.uploadCover(tripId, fd);
      }

      return tripRes.data.trip;
    },
    onSuccess: (trip) => {
      toast.success(`Trip "${trip.name}" created! 🎉`);
      navigate(`/trips/${trip._id}`);
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create trip'),
  });

  const onDrop = useCallback((files) => {
    if (files[0]) {
      setCoverFile(files[0]);
      setCoverPreview(URL.createObjectURL(files[0]));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false });

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate('/trips')} 
        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 w-fit"
      >
        <ArrowLeft size={16} className="stroke-[2.5]" /> 
        <span>Back to Trips</span>
      </button>

      <div>
        <h1 className="text-3xl sm:text-[40px] font-extrabold text-slate-800 tracking-tight leading-none">Create Trip</h1>
        <p className="text-slate-500 text-sm font-medium mt-3">Design your next adventure and invite your travel squad</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 sm:space-y-8">
        
        {/* Cover Image Upload */}
        <GlassCard className="!p-0 overflow-hidden border-white/60 shadow-sm rounded-[32px] group relative">
          <div
            {...getRootProps()}
            className={clsx(
              'h-[240px] sm:h-[300px] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden',
              isDragActive ? 'bg-primary-50/80 border-2 border-dashed border-primary-400' : 'bg-slate-50/50 hover:bg-slate-100/50'
            )}
          >
            <input {...getInputProps()} />
            
            {/* Background decorative elements */}
            {!coverPreview && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-100 rounded-full blur-3xl opacity-50" />
              </div>
            )}

            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                  <Upload size={32} className="text-white drop-shadow-md" />
                  <p className="text-white text-[13px] font-bold uppercase tracking-wider drop-shadow-md">Change Cover Image</p>
                </div>
                <button 
                  type="button" 
                  onClick={e => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} 
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-danger/80 backdrop-blur-md rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <X size={16} className="text-white stroke-[2.5]" />
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 relative z-10 px-6">
                <div className="w-20 h-20 mx-auto bg-white shadow-sm rounded-[24px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <ImageIcon size={32} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-slate-700 text-[15px] font-bold">{isDragActive ? 'Drop image here' : 'Upload Cover Photo'}</p>
                  <p className="text-slate-500 text-xs mt-1">Drag & drop or click to browse</p>
                </div>
                <Badge variant="gray" className="mx-auto bg-white border-slate-200">Recommended size: 1200×600</Badge>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Form Details */}
        <GlassCard className="!p-6 sm:!p-10 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3">Essential Details</h3>
            
            {/* Trip Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Trip Name *</label>
              <input 
                {...register('name')} 
                placeholder="e.g. Summer in Tokyo 2026" 
                className={clsx('w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm', errors.name && '!border-danger/50 focus:!border-danger/80 bg-danger/5')} 
              />
              {errors.name && <p className="text-danger text-[11px] font-bold mt-2 flex items-center gap-1"><Info size={12}/> {errors.name.message}</p>}
            </div>

            {/* Destination */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Destination *</label>
              <div className="relative group">
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  {...register('destination')} 
                  placeholder="e.g. Tokyo, Japan" 
                  className={clsx('w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 pl-12 pr-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm', errors.destination && '!border-danger/50 focus:!border-danger/80 bg-danger/5')} 
                />
              </div>
              {errors.destination && <p className="text-danger text-[11px] font-bold mt-2 flex items-center gap-1"><Info size={12}/> {errors.destination.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                <span>Description</span>
                <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
              </label>
              <textarea 
                {...register('description')} 
                rows={3} 
                placeholder="What's the vibe of this trip?" 
                className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm resize-none" 
              />
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3">Dates & Budget</h3>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
                <div className="relative group">
                  <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary-500 transition-colors pointer-events-none" />
                  <input 
                    {...register('startDate')} 
                    type="date" 
                    className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 pl-12 pr-5 py-4 text-[15px] font-medium text-slate-800 rounded-[20px] transition-all shadow-sm date-input-field" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
                <div className="relative group">
                  <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary-500 transition-colors pointer-events-none" />
                  <input 
                    {...register('endDate')} 
                    type="date" 
                    className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 pl-12 pr-5 py-4 text-[15px] font-medium text-slate-800 rounded-[20px] transition-all shadow-sm date-input-field" 
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                  <span>Target Budget</span>
                  <span className="text-slate-400 font-medium tracking-normal lowercase">Optional</span>
                </label>
                <div className="relative group">
                  <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-success transition-colors" />
                  <input 
                    {...register('budget', { valueAsNumber: true })} 
                    type="number" 
                    step="1" 
                    placeholder="e.g. 50000" 
                    className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 pl-12 pr-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Currency</label>
                <select 
                  {...register('currency')} 
                  className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 px-5 py-4 text-[15px] font-medium text-slate-800 rounded-[20px] transition-all shadow-sm appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.2rem' }}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3">Organization</h3>
            
            {/* Tags */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                <span>Tags</span>
                <span className="text-slate-400 font-medium tracking-normal lowercase">Comma separated</span>
              </label>
              <input 
                {...register('tags')} 
                placeholder="e.g. beach, adventure, food, budget" 
                className="w-full glass-sm bg-white/50 border-white/80 focus:border-white focus:bg-white/90 px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-[20px] transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/60 mt-8">
            <button 
              type="button" 
              onClick={() => navigate('/trips')} 
              className="btn-secondary rounded-full py-4 px-8 font-bold tracking-wide shadow-sm hover:scale-105 transition-transform duration-300 w-full sm:w-auto sm:flex-1"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary rounded-full py-4 px-8 font-bold tracking-wide shadow-glow hover:shadow-float flex items-center justify-center gap-2 w-full sm:w-auto sm:flex-[2]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {mutation.isPending ? <Spinner size="sm" className="border-white" /> : (
                <>
                  <Plane size={18} className="stroke-[2.5]" />
                  <span>Create Trip</span>
                </>
              )}
            </motion.button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
