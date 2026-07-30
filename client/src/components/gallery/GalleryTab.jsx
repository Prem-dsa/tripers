import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, FileText, Camera, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { galleryApi } from '../../api';
import { Avatar, EmptyState, Spinner, Badge } from '../ui/index';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const FILE_TYPES = ['all', 'photo', 'video', 'receipt', 'document'];
const TYPE_ICONS = { photo: Image, video: Film, receipt: Camera, document: FileText };

export default function GalleryTab({ tripId }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', tripId, filter],
    queryFn: () => galleryApi.getTripGallery(tripId, { fileType: filter === 'all' ? '' : filter }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: galleryApi.delete,
    onSuccess: () => { queryClient.invalidateQueries(['gallery', tripId]); toast.success('Deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const gallery = data?.gallery || [];
  const photos = gallery.filter(g => g.fileType === 'photo' || g.fileType === 'video');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('tripId', tripId);
        fd.append('fileType', file.type.startsWith('video') ? 'video' : file.type === 'application/pdf' ? 'document' : uploadType);
        await galleryApi.upload(fd);
      }
      queryClient.invalidateQueries(['gallery', tripId]);
      toast.success(`${acceptedFiles.length} file(s) uploaded!`);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }, [tripId, uploadType, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true, accept: { 'image/*': [], 'video/*': [], 'application/pdf': [] } });

  const lightboxItems = gallery.filter(g => g.fileType === 'photo');

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-[20px] bg-white/40 shadow-sm',
          isDragActive ? 'border-primary-500 bg-primary-50/40' : 'border-white/80 hover:border-primary-300 hover:bg-white/60'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-[16px] bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
              <Upload size={20} className="text-primary-500" />
            </div>
            <p className="text-slate-800 font-extrabold text-sm tracking-tight">{isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}</p>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Photos, videos, receipts, documents (max 20MB)</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILE_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={clsx(
              'px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap flex-shrink-0',
              filter === type
                ? 'bg-primary-500 text-white shadow-glow'
                : 'bg-white/60 border border-white/80 text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-[20px]" />)}
        </div>
      ) : !gallery.length ? (
        <EmptyState icon={<Image size={32} className="text-primary-500" />} title="No media yet" description="Upload photos, videos, and documents" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {gallery.map((item, i) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-[20px] overflow-hidden bg-white/60 border border-white/80 cursor-pointer shadow-sm hover:shadow-float transition-all duration-300"
                onClick={() => { if (item.fileType === 'photo') setLightbox(lightboxItems.findIndex(g => g._id === item._id)); }}
              >
                {item.fileType === 'photo' && (
                  <img src={item.fileUrl} alt={item.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                {item.fileType === 'video' && (
                  <video src={item.fileUrl} className="w-full h-full object-cover" />
                )}
                {(item.fileType === 'document' || item.fileType === 'receipt') && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 p-4">
                    <FileText size={32} className="text-primary-500" />
                    <p className="text-slate-600 text-xs px-2 text-center truncate font-bold">{item.caption || item.fileType}</p>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3.5">
                  <div className="flex justify-between items-center">
                    <Badge variant={item.fileType === 'photo' ? 'primary' : 'gray'} className="text-[9px] uppercase">{item.fileType}</Badge>
                    {item.uploadedBy?._id === user?._id && (
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(item._id); }} className="w-6 h-6 bg-danger rounded-full flex items-center justify-center shadow-sm">
                        <X size={11} className="text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar src={item.uploadedBy?.photo} name={item.uploadedBy?.fullName} size="xs" />
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold truncate">{item.uploadedBy?.fullName.split(' ')[0]}</p>
                      <p className="text-white/60 text-[9px] font-medium">{format(new Date(item.createdAt), 'MMM d')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors" onClick={() => setLightbox(null)}>
              <X size={20} />
            </button>
            {lightbox > 0 && (
              <button className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors" onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
                <ChevronLeft size={24} />
              </button>
            )}
            {lightbox < lightboxItems.length - 1 && (
              <button className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors" onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
                <ChevronRight size={24} />
              </button>
            )}
            <motion.img
              key={lightbox}
              src={lightboxItems[lightbox]?.fileUrl}
              alt="Gallery"
              className="max-w-full max-h-[85vh] object-contain rounded-[24px] shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute bottom-6 text-white/70 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">{lightbox + 1} / {lightboxItems.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
