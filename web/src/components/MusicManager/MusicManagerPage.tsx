import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  List, Grid, Heart, Plus, Search, ArrowLeft, Clock,
  Music2, Mic2, Disc3, Settings2, Trash2
} from 'lucide-react';
import { formatTime } from './mockData';
import { getMusicList, uploadMusic, deleteMusic, toggleFavoriteMusic, logMusicPlay, type MusicItem } from '@/api/music';

export default function MusicManagerPage() {
  const navigate = useNavigate();
  const [musicList, setMusicList] = useState<MusicItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchMusicList();
  }, []);

  const fetchMusicList = async () => {
    try {
      const res: any = await getMusicList();
      if (res.code === 0) {
        const dbList = (res.data || []).map((m: any) => ({
          id: m.id || m.id || Math.random().toString(),
          title: m.title || "未知歌曲",
          artist: m.artist || "未知艺术家",
          album: m.album || "未知专辑",
          coverUrl: m.coverUrl || "",
          audioUrl: m.audioUrl || "",
          duration: m.duration || 0,
          isFavorite: !!m.isFavorite,
          lastPlayedAt: m.lastPlayedAt
        }));
        setMusicList(dbList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');

  // Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  const filteredMusic = useMemo(() => {
    let list = [...musicList];
    if (activeTab === 'favorites') {
      list = list.filter(m => m.isFavorite);
    } else if (activeTab === 'recent') {
      list = list.filter(m => m.lastPlayedAt).sort((a, b) => {
        return new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime();
      });
    }

    if (searchQuery) {
      list = list.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [musicList, searchQuery, activeTab]);

  const currentTrack = currentTrackIndex !== null ? filteredMusic[currentTrackIndex] : null;

  // Audio Event Handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    const updateProgress = () => {
      if (isDraggingRef.current) return;
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / (audio.duration || 1));
    };

    const handleEnded = () => {
      if (currentTrackIndex !== null) {
        if (currentTrackIndex < filteredMusic.length - 1) {
          setCurrentTrackIndex(currentTrackIndex + 1);
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, filteredMusic.length, isMuted, volume]);

  const [lastLoggedTrackId, setLastLoggedTrackId] = useState<string | number | null>(null);

  const prevTrackId = useRef<string | number | null>(null);

  const logPlay = async (track: MusicItem) => {
    if (!track.id) return;
    try {
      await logMusicPlay(Number(track.id));
      setMusicList(prev => prev.map(m => m.id === track.id ? { ...m, lastPlayedAt: new Date().toISOString() } : m));
    } catch { }
  };

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    // 当切歌的时候触发
    if (currentTrack.id !== prevTrackId.current) {
      prevTrackId.current = currentTrack.id;

      setIsPlaying(true);
      audioRef.current.play().catch(e => console.error("Playback error", e));

      if (currentTrack.id !== lastLoggedTrackId) {
        setLastLoggedTrackId(currentTrack.id);
        logPlay(currentTrack);
      }
    }
  }, [currentTrack]);

  // 当仅仅切换播放/暂停状态的时候触发
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.log(e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (currentTrackIndex === null && filteredMusic.length > 0) {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else if (currentTrackIndex !== null) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex !== null && currentTrackIndex < filteredMusic.length - 1) setCurrentTrackIndex(currentTrackIndex + 1);
  };
  const handlePrev = () => {
    if (currentTrackIndex !== null && currentTrackIndex > 0) setCurrentTrackIndex(currentTrackIndex - 1);
  };

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    isDraggingRef.current = false;
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (audioRef.current) {
      const dur = audioRef.current.duration || currentTrack?.duration || 0;
      if (dur > 0) audioRef.current.currentTime = val * dur;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const audioUrl = URL.createObjectURL(file);
      const duration = await new Promise<number>((resolve) => {
        const audioObj = new Audio(audioUrl);
        audioObj.onloadedmetadata = () => resolve(audioObj.duration);
        audioObj.onerror = () => resolve(0);
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('duration', String(duration));

      try {
        await uploadMusic(formData);
      } catch (err) {
        console.error("Upload error", err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchMusicList();
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      await toggleFavoriteMusic(Number(id));
      // Locally toggle the favorite status to avoid full refresh delay
      setMusicList(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
    } catch (err) {
      console.error("Favorite failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-200 selection:bg-purple-500/30 font-sans flex overflow-hidden">
      <audio ref={audioRef} src={currentTrack?.audioUrl} />

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0B0D14] flex flex-col pt-6 pb-24 shrink-0 shadow-2xl z-10">
        <div className="px-6 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group mb-8"
          >
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            返回主导航
          </button>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">音乐馆</h2>
            <input type="file" multiple accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8 pb-4 scrollbar-hide">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">库</h4>
            <SidebarItem icon={Music2} label="所有音乐" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            <SidebarItem icon={Heart} label="我喜欢的" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">播放列表</h4>
            <SidebarItem icon={List} label="最近播放" active={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-0 bg-[#07080C] bg-gradient-to-br from-purple-900/10 to-transparent">
        <header className="h-20 border-b border-white/5 bg-black/20 flex-shrink-0 flex items-center justify-between px-8 z-10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Music2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                音乐管理
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400" />
              <input
                type="text" placeholder="搜索歌名或歌手..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Grid className="w-4 h-4" /></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-32">
          <div className="mb-8 mt-2 flex items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
              {activeTab === 'favorites' ? <Heart className="w-16 h-16 text-white/50" /> : activeTab === 'recent' ? <Clock className="w-16 h-16 text-white/50" /> : <Music2 className="w-16 h-16 text-white/50" />}
            </div>
            <div className="pb-2">
              <h1 className="text-4xl font-extrabold text-white mb-2">{activeTab === 'favorites' ? '我喜欢的' : activeTab === 'recent' ? '最近播放' : '所有音乐'}</h1>
              <p className="text-slate-400 text-sm">{filteredMusic.length} 首好歌等你发现</p>
            </div>
            <button
              onClick={handlePlayPause}
              className="ml-auto w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center shadow-lg transition-all"
            >
              {isPlaying && filteredMusic.length > 0 ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 ml-1 fill-white" />}
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="w-full">
              <div className="flex items-center px-4 py-2 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <div className="w-12 text-center">#</div>
                <div className="w-10"></div>
                <div className="flex-1">标题</div>
                <div className="flex-1 hidden md:block">专辑</div>
                <div className="w-20 hidden sm:block text-right"><Clock className="w-4 h-4 inline" /></div>
                <div className="w-12"></div>
              </div>

              <div className="space-y-1">
                {filteredMusic.map((item, index) => {
                  const isActive = currentTrackIndex === index;
                  return (
                    <div
                      key={item.id}
                      onDoubleClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                      className={`flex items-center px-4 py-3 rounded-xl group cursor-pointer border border-transparent ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <div className="w-12 text-center flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <div className="flex items-end gap-[2px] h-4">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-purple-400 rounded-full" />
                            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-purple-400 rounded-full" />
                            <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-purple-400 rounded-full" />
                          </div>
                        ) : (
                          <span className="text-slate-500 group-hover:hidden text-sm">{index + 1}</span>
                        )}
                        {!isActive && (
                          <button className="hidden group-hover:flex text-slate-300 hover:text-white" onClick={(e) => { e.stopPropagation(); setCurrentTrackIndex(index); setIsPlaying(true); }}><Play className="w-4 h-4 fill-current" /></button>
                        )}
                        {isActive && !isPlaying && (
                          <button className="text-purple-400" onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }}><Play className="w-4 h-4 fill-current" /></button>
                        )}
                      </div>

                      <div className="w-10 text-center">
                        <button onClick={(e) => handleToggleFavorite(e, item.id)} className="transition-transform hover:scale-110 focus:outline-none">
                          <Heart className={`w-4 h-4 transition-colors ${item.isFavorite ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-slate-600 hover:text-slate-400'}`} />
                        </button>
                      </div>

                      <div className="flex-1 flex items-center gap-4">
                        <img src={item.coverUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isActive ? 'text-purple-400' : 'text-slate-200'}`}>{item.title}</p>
                          <p className="text-slate-500 text-xs truncate mt-0.5">{item.artist}</p>
                        </div>
                      </div>

                      <div className="flex-1 hidden md:block">
                        <p className="text-slate-400 text-sm truncate">{item.album}</p>
                      </div>

                      <div className="w-20 hidden sm:block text-right text-sm text-slate-500">
                        {formatTime(item.duration)}
                      </div>

                      <div className="w-12 text-center opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button onClick={async (e) => { e.stopPropagation(); await deleteMusic(Number(item.id)); fetchMusicList(); }} className="text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4 mx-auto" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredMusic.map((item, index) => {
                const isActive = currentTrackIndex === index;
                return (
                  <div key={item.id} className="group flex flex-col cursor-pointer" onClick={() => { isActive ? setIsPlaying(!isPlaying) : (() => { setCurrentTrackIndex(index); setIsPlaying(true); })(); }}>
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3">
                      <img src={item.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105" />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isActive && isPlaying ? <Pause className="w-12 h-12 fill-white text-white" /> : <Play className="w-12 h-12 fill-white text-white ml-2" />}
                      </div>
                      <button onClick={(e) => handleToggleFavorite(e, item.id)} className="absolute top-2 left-2 p-2">
                        <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${item.isFavorite ? 'text-pink-500 fill-pink-500 drop-shadow-md' : 'text-white/70 hover:text-white'}`} />
                      </button>
                      <button onClick={async (e) => { e.stopPropagation(); await deleteMusic(Number(item.id)); fetchMusicList(); }} className="absolute top-2 right-2 p-2 bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-purple-400' : 'text-slate-200'}`}>{item.title}</h3>
                    <p className="text-slate-500 text-xs mt-1 truncate">{item.artist}</p>
                  </div>
                );
              })}
            </div>
          )}

          {filteredMusic.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Music2 className="w-16 h-16 mb-4 opacity-20" />
              <p>暂无音乐空空如也</p>
            </div>
          )}
        </div>
      </main>

      {/* Global Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0F111A]/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center px-6 gap-8">
        <div className="w-1/4 flex items-center gap-4 min-w-0">
          {currentTrack ? (
            <>
              <div className="relative w-14 h-14 flex-shrink-0">
                <img src={currentTrack.coverUrl} className={`w-full h-full rounded-full object-cover border border-white/10 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`} alt="" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full" />
              </div>
              <div className="min-w-0">
                <h4 className="text-slate-200 text-sm font-semibold truncate hover:underline cursor-pointer">{currentTrack.title}</h4>
                <p className="text-slate-500 text-xs truncate mt-1">{currentTrack.artist}</p>
              </div>
              <button onClick={(e) => handleToggleFavorite(e, currentTrack.id)} className="ml-2 transition-transform hover:scale-110 hidden sm:block">
                <Heart className={`w-5 h-5 ${currentTrack.isFavorite ? 'text-pink-500 fill-pink-500 drop-shadow-md' : 'text-slate-500 hover:text-slate-400'}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center"><Music2 className="w-6 h-6 text-slate-500" /></div>
              <div>
                <h4 className="text-slate-400 text-sm font-medium">享受静谧时光</h4>
                <p className="text-slate-600 text-xs mt-1">--</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-6">
            <button onClick={handlePrev} className="text-slate-400 hover:text-white"><SkipBack className="w-5 h-5 fill-current" /></button>
            <button onClick={handlePlayPause} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
              {isPlaying && currentTrack ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={handleNext} className="text-slate-400 hover:text-white"><SkipForward className="w-5 h-5 fill-current" /></button>
          </div>
          <div className="w-full flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span>{currentTrack ? formatTime(currentTime) : '0:00'}</span>
            <div className="flex-1 relative group cursor-pointer flex items-center h-4">
              <input
                type="range" min="0" max="1" step="0.001" value={progress}
                onMouseDown={() => { isDraggingRef.current = true; }} onMouseUp={handleSeekEnd}
                onTouchStart={() => { isDraggingRef.current = true; }} onTouchEnd={handleSeekEnd}
                onChange={handleDrag} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white group-hover:bg-purple-500 transition-colors" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <span>{currentTrack ? formatTime(currentTrack.duration) : '0:00'}</span>
          </div>
        </div>

        <div className="w-1/4 flex justify-end items-center gap-4 hidden sm:flex">
          <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-24 relative group flex items-center h-4">
            <input
              type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
              onChange={(e) => { const val = parseFloat(e.target.value); setVolume(val); setIsMuted(val === 0); if (audioRef.current) { audioRef.current.volume = val; audioRef.current.muted = (val === 0); } }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-slate-300 group-hover:bg-purple-500 transition-colors" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );
}
