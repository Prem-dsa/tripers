import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { tripApi } from '../../api';
import { GlassCard, Spinner } from '../../components/ui/index';
import { CURRENCIES } from '../../utils/currency';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'cancelled'];

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
      toast.success('Trip updated!');
      navigate(`/trips/${id}`);
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  });

  if (isLoading) return <div className="flex-center py-12"><Spinner /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(`/trips/${id}`)} className="flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm">
        <ArrowLeft size={16} /> Back to Trip
      </button>
      <div><h1 className="text-2xl font-bold text-white">Edit Trip</h1></div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <GlassCard className="space-y-5">
          <div>
            <label className="label">Trip Name *</label>
            <input {...register('name', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Destination *</label>
            <input {...register('destination', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input {...register('startDate')} type="date" className="input" /></div>
            <div><label className="label">End Date</label><input {...register('endDate')} type="date" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Budget</label><input {...register('budget', { valueAsNumber: true })} type="number" className="input" /></div>
            <div><label className="label">Currency</label>
              <select {...register('currency')} className="input">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select {...register('status')} className="input">
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Tags (comma separated)</label><input {...register('tags')} className="input" /></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/trips/${id}`)} className="btn-outline btn flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary btn flex-1 gap-2">
              {mutation.isPending ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
