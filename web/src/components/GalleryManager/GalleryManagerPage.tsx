import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Heart, 
  Clock, 
  Search, 
  Plus,
  X,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft
} from 'lucide-react';
import { groupMediaByDate, type MediaItem } from './mockData';
import { getMediaList, uploadMedia, deleteMedia } from '@/api/gallery';

export default function GalleryManagerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, photos, videos, favorites
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const res: any = await getMediaList();
      if (res.code === 0) {
        const dbList = (res.data || []).map((m: any) => ({
           id: String(m.id || m.id || Math.random()),
           type: m.fileType || m.type || 'image',
           url: m.url || "",
           thumbnail: m.thumbnail || "",
           title: m.fileName || m.title || "未命名",
           CreatedAt: m.CreatedAt || m.date || new Date().toISOString(), // fix: map to CreatedAt, not date
           location: "",
           duration: m.duration || ""
        }));
        setMediaList(dbList);
      }
    } catch(e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchMedia();
  }, []);

  // Flatten media list logic for lightbox navigation
  const filteredMedia = useMemo(() => {
    return mediaList.filter(m => {
      if (activeTab === 'photos' && m.type !== 'image') return false;
      if (activeTab === 'videos' && m.type !== 'video') return false;
      if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) && !m.location?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [mediaList, activeTab, searchQuery]);

  const groupedMedia = useMemo(() => groupMediaByDate(filteredMedia), [filteredMedia]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        let durationStr = '';
        let thumbnailBlob: Blob | undefined;
        
        if (type === 'video') {
            const extracted = await new Promise<{duration:number, blob: Blob | undefined}>((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = URL.createObjectURL(file);
                video.muted = true;
                video.playsInline = true;

                video.onloadeddata = () => {
                    video.currentTime = Math.min(1, video.duration / 2 || 0);
                };
                
                video.onseeked = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob((b) => {
                            URL.revokeObjectURL(video.src);
                            resolve({ duration: video.duration, blob: b || undefined });
                        }, 'image/jpeg', 0.8);
                    } else {
                        resolve({ duration: video.duration, blob: undefined });
                    }
                };
                
                video.onerror = () => resolve({ duration: 0, blob: undefined });
            });
            
            const mins = Math.floor(extracted.duration / 60);
            const secs = Math.floor(extracted.duration % 60).toString().padStart(2, '0');
            durationStr = `${mins}:${secs}`;
            thumbnailBlob = extracted.blob;
        }
        
        try {
            await uploadMedia({ file, type, duration: durationStr, thumbnail: thumbnailBlob });
        } catch(err) {
            console.error('Upload failed', err);
        }
    }
    
    await fetchMedia();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (index: number) => {
    const item = filteredMedia[index];
    if (!item || !item.id) return;

    if (!confirm('确定要删除此媒体文件吗？')) return;

    try {
        await deleteMedia(item.id);
        // Refresh the list
        await fetchMedia();
        
        // Handle lightbox state logic after deletion
        if (filteredMedia.length <= 1) {
             setLightboxIndex(null);
        } else {
             // either move index to the next, or to the previous if it's the last item
             setLightboxIndex(Math.min(index, filteredMedia.length - 2)); 
        }
    } catch(err) {
        console.error('Delete failed', err);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 项媒体文件吗？`)) return;

    try {
      await Promise.all(selectedIds.map(id => deleteMedia(id)));
      setSelectedIds([]);
      await fetchMedia();
    } catch (err) {
      console.error('Batch delete failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-200 selection:bg-blue-500/30 font-sans flex h-screen overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#11131C] flex flex-col pt-6 pb-4 shrink-0 shadow-2xl z-10">
        <div className="px-6 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                图库
              </div>
            </div>
            <input 
              type="file" 
              multiple
              accept="image/*,video/*"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            <button 
              onClick={handleUploadClick}
              className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white transition-all active:scale-95"
              title="上传媒体"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 space-y-8">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">资料库</h4>
            <SidebarItem icon={Clock} label="所有照片" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            <SidebarItem icon={ImageIcon} label="照片" active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
            <SidebarItem icon={Video} label="视频" active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-[#11131C]/60 backdrop-blur-3xl relative">
        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {Object.entries(groupedMedia).map(([groupName, items]) => (
            <div key={groupName} className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6 sticky top-0 bg-[#090A0F]/80 backdrop-blur-xl py-2 z-10 z-[11] inline-block pr-6 rounded-r-3xl">
                {groupName}
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-[2px]">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={item.id}
                      onClick={() => {
                        if (selectedIds.length > 0) {
                          toggleSelection(item.id);
                        } else {
                          const idx = filteredMedia.findIndex(m => m.id === item.id);
                          setLightboxIndex(idx);
                        }
                      }}
                      className={`aspect-square relative group bg-[#1A1D27] cursor-pointer overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-inset ring-blue-500 scale-[0.95] rounded-xl' : ''}`}
                    >
                      {/* Selection Checkbox overlay */}
                      <div className="absolute top-2 left-2 z-20">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(item.id);
                          }}
                          className={`p-1 rounded-full transition-all ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'bg-black/30 text-white/70 hover:bg-black/50 opacity-0 group-hover:opacity-100'} backdrop-blur-md`}
                        >
                          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </div>

                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${isSelected ? 'scale-110 rounded-xl' : ''}`}
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <video 
                            src={item.url} 
                            poster={item.thumbnail || undefined}
                            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80 pointer-events-none ${isSelected ? 'scale-110 rounded-xl' : ''}`}
                            preload="metadata"
                            muted
                            playsInline
                          />
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/90 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-medium font-mono z-10">
                            <PlayCircle className="w-3 h-3" /> 
                            {item.duration || '0:00'}
                          </div>
                        </>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                        <p className="text-white text-xs font-medium truncate">{item.title}</p>
                        {item.location && <p className="text-slate-300 text-[10px] truncate">{item.location}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredMedia.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>暂无照片或视频</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Bar for Batch Selection */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-[#212431]/95 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-full shadow-2xl z-40 text-white"
          >
            <span className="text-sm font-medium text-blue-400">已选择 {selectedIds.length} 项</span>
            <div className="w-px h-6 bg-white/10"></div>
            <button onClick={() => setSelectedIds([])} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">取消</button>
            <button 
                onClick={handleBatchDelete} 
                className="flex items-center gap-2 text-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full transition-all font-medium"
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Fullscreen Viewer */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center"
          >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-10 transition-opacity">
              <div className="flex items-center gap-4 text-white">
                <span className="font-medium text-sm drop-shadow-md">{filteredMedia[lightboxIndex]?.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"><ZoomIn className="w-5 h-5" /></button>
                <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"><Download className="w-5 h-5" /></button>
                <button 
                  onClick={() => handleDelete(lightboxIndex)}
                  className="p-2 rounded-full hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Arrows */}
            {lightboxIndex > 0 && (
              <button 
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            {lightboxIndex < filteredMedia.length - 1 && (
              <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Main Image/Video */}
            <div className="w-full h-full p-16 flex items-center justify-center max-w-7xl max-h-screen">
              {filteredMedia[lightboxIndex].type === 'image' ? (
                <motion.img 
                  key={filteredMedia[lightboxIndex].id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={filteredMedia[lightboxIndex].url}
                  className="max-w-full max-h-full object-contain filter drop-shadow-2xl"
                  alt="Gallery Full"
                />
              ) : (
                <motion.video 
                  key={filteredMedia[lightboxIndex].id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={filteredMedia[lightboxIndex].url} 
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
        active 
        ? 'bg-blue-500/15 text-blue-400 font-medium' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium'
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
      {label}
    </button>
  );
}
