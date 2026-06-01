export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
}

// Initial mock library
export const MOCK_MUSIC: MusicItem[] = [
  {
    id: 'm1',
    title: 'Cyberpunk Cityscape',
    artist: 'Synthwave Dreams',
    album: 'Neon Nights',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cyberpunk-city-114605.mp3',
    duration: 184
  },
  {
    id: 'm2',
    title: 'Deep House Flow',
    artist: 'DJ Chill',
    album: 'Summer Vibes',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b8f72c8e.mp3?filename=deep-house-114946.mp3',
    duration: 156
  },
  {
    id: 'm3',
    title: 'Lo-Fi Study Loop',
    artist: 'Chillhop Beats',
    album: 'Rainy Days',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b9?q=80&w=600&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d0c6ff1b38.mp3?filename=lofi-study-112191.mp3',
    duration: 135
  },
  {
    id: 'm4',
    title: 'Epic Cinematic Trailer',
    artist: 'Hans Zimmer Clone',
    album: 'Action Movie Score',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_92cb6ce51b.mp3?filename=epic-cinematic-trailer-113947.mp3',
    duration: 122
  }
];

export const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
