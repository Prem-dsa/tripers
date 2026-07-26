import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, Image, X, ArrowLeft, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { clsx } from 'clsx';
import { tripApi } from '../../api';
import { GlassCard, Spinner } from '../../components/ui/index';
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
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/trips')} className="flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm">
        <ArrowLeft size={16} /> Back to Trips
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Create New Trip</h1>
        <p className="text-dark-300 text-sm mt-1">Set up your trip details and invite your travel squad</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Cover Image */}
        <GlassCard className="!p-0 overflow-hidden">
          <div
            {...getRootProps()}
            className={clsx(
              'h-40 flex-center cursor-pointer transition-all relative',
              isDragActive ? 'bg-primary-400/10' : 'hover:bg-white/3'
            )}
          >
            <input {...getInputProps()} />
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex-center flex-col gap-2">
                  <Upload size={24} className="text-white" />
                  <p className="text-white text-sm font-medium">Change cover</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex-center">
                  <X size={14} className="text-white" />
                </button>
              </>
            ) : (
              <div className="text-center space-y-2">
                <Image size={32} className="text-dark-400 mx-auto" />
                <p className="text-dark-200 text-sm font-medium">{isDragActive ? 'Drop image here' : 'Add cover photo'}</p>
                <p className="text-dark-500 text-xs">Drag & drop or click • Recommended 1200×600</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="space-y-5">
          {/* Trip Name */}
          <div>
            <label className="label">Trip Name *</label>
            <input {...register('name')} placeholder="Goa Trip 2025, Europe Backpacking..." className={clsx('input', errors.name && 'input-error')} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Destination */}
          <div>
            <label className="label">Destination *</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input {...register('destination')} placeholder="Goa, India" className={clsx('input pl-9', errors.destination && 'input-error')} />
            </div>
            {errors.destination && <p className="text-red-400 text-xs mt-1">{errors.destination.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="text-dark-500">(optional)</span></label>
            <textarea {...register('description')} rows={3} placeholder="Tell your crew what this trip is about..." className="input resize-none" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input {...register('startDate')} type="date" className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">End Date</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input {...register('endDate')} type="date" className="input pl-9" />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Budget <span className="text-dark-500">(optional)</span></label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input {...register('budget', { valueAsNumber: true })} type="number" step="1" placeholder="50000" className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Currency</label>
              <select {...register('currency')} className="input">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags <span className="text-dark-500">(comma separated)</span></label>
            <input {...register('tags')} placeholder="beach, adventure, food, budget" className="input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/trips')} className="btn-outline btn flex-1">Cancel</button>
            <motion.button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary btn flex-1 gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {mutation.isPending ? <Spinner size="sm" /> : '✈️ Create Trip'}
            </motion.button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
