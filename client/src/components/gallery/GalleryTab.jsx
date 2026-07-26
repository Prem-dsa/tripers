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
    <div className="space-y-5 text-[#1E1B4B]">
      {/* Upload */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#F8F5FF]',
          isDragActive ? 'border-[#6D4AFF] bg-[#F3F0FF]' : 'border-[#E9E2FF] hover:border-[#6D4AFF]/50'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex-center flex-col gap-2">
            <Spinner />
            <p className="text-[#6B5CA5] text-sm font-semibold">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload size={28} className="text-[#6D4AFF] mx-auto mb-2" />
            <p className="text-[#1E1B4B] font-bold text-sm">{isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}</p>
            <p className="text-[#6B5CA5] text-xs mt-1 font-semibold">Photos, videos, receipts, documents (max 20MB each)</p>
          </>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILE_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={clsx('btn text-xs px-3 py-1.5 rounded-lg capitalize whitespace-nowrap flex-shrink-0', filter === type ? 'btn-primary' : 'btn-secondary')}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
        </div>
      ) : !gallery.length ? (
        <EmptyState icon={<Image size={32} className="text-[#6D4AFF]" />} title="No media yet" description="Upload photos, videos, and documents" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {gallery.map((item, i) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#F8F5FF] border border-[#E9E2FF] cursor-pointer"
                onClick={() => { if (item.fileType === 'photo') setLightbox(lightboxItems.findIndex(g => g._id === item._id)); }}
              >
                {item.fileType === 'photo' && (
                  <img src={item.fileUrl} alt={item.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                {item.fileType === 'video' && (
                  <video src={item.fileUrl} className="w-full h-full object-cover" />
                )}
                {(item.fileType === 'document' || item.fileType === 'receipt') && (
                  <div className="w-full h-full flex-center flex-col gap-2 bg-[#F8F5FF]">
                    <FileText size={32} className="text-[#6D4AFF]" />
                    <p className="text-[#6B5CA5] text-xs px-2 text-center truncate font-bold">{item.caption || item.fileType}</p>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#1E1B4B]/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <Badge variant={item.fileType === 'photo' ? 'primary' : 'gray'} className="text-xs">{item.fileType}</Badge>
                    {item.uploadedBy?._id === user?._id && (
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(item._id); }} className="w-6 h-6 bg-[#EF4444] rounded-full flex-center">
                        <X size={11} className="text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Avatar src={item.uploadedBy?.photo} name={item.uploadedBy?.fullName} size="xs" className="ring-1 ring-white/10" />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold truncate">{item.uploadedBy?.fullName.split(' ')[0]}</p>
                      <p className="text-white/60 text-[10px] font-semibold">{format(new Date(item.createdAt), 'MMM d')}</p>
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
            className="fixed inset-0 z-50 bg-[#1E1B4B]/95 backdrop-blur-md flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 btn-icon bg-white/10 text-white hover:bg-white/20" onClick={() => setLightbox(null)}>
              <X size={20} />
            </button>
            {lightbox > 0 && (
              <button className="absolute left-4 top-1/2 -translate-y-1/2 btn-icon bg-white/10 text-white hover:bg-white/20" onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
                <ChevronLeft size={24} />
              </button>
            )}
            {lightbox < lightboxItems.length - 1 && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 btn-icon bg-white/10 text-white hover:bg-white/20" onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
                <ChevronRight size={24} />
              </button>
            )}
            <motion.img
              key={lightbox}
              src={lightboxItems[lightbox]?.fileUrl}
              alt="Gallery"
              className="max-w-full max-h-full object-contain rounded-xl px-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute bottom-4 text-white/70 text-sm font-semibold">{lightbox + 1} / {lightboxItems.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
