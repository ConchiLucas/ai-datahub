export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string; // for videos mainly, but we can reuse url for both in mock
  title: string;
  CreatedAt: string; // ISO format or Unix timestamp mapped to dates
  width?: number;
  height?: number;
  location?: string;
  duration?: string; // e.g. "0:15"
}

// Helper to get past dates
const d = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const MOCK_MEDIA: MediaItem[] = [
  // Today's media
  {
    id: 'm1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687982501-1e58f813fc07?q=80&w=1000&auto=format&fit=crop',
    title: 'Sunset over the canyon',
    CreatedAt: d(0),
    location: 'Grand Canyon, AZ'
  },
  {
    id: 'm2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
    title: 'City lights',
    CreatedAt: d(0),
    location: 'Tokyo, Japan'
  },
  {
    id: 'm3',
    type: 'video',
    url: 'https://cdn.pixabay.com/vimeo/328940142/waves-22756.mp4?width=640&hash=85d3df39ad615170d1eddf6ce8a4c8f5f6b2839f',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1000&auto=format&fit=crop',
    title: 'Ocean Waves',
    CreatedAt: d(0),
    duration: '0:24'
  },
  
  // Yesterday's media
  {
    id: 'm4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=1000&auto=format&fit=crop',
    title: 'Desert dunes',
    CreatedAt: d(1),
    location: 'Sahara'
  },
  {
    id: 'm5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1707345512638-b9a304e21a22?q=80&w=1000&auto=format&fit=crop',
    title: 'Mountain reflection',
    CreatedAt: d(1),
  },
  {
    id: 'm6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?q=80&w=1000&auto=format&fit=crop',
    title: 'Forest mist',
    CreatedAt: d(1)
  },
  {
    id: 'm7',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682685797365-41f45b562c0a?q=80&w=1000&auto=format&fit=crop',
    title: 'Canyon hiking',
    CreatedAt: d(1),
    location: 'Zion National Park'
  },
  
  // Last Week
  {
    id: 'm8',
    type: 'video',
    url: 'https://cdn.pixabay.com/vimeo/281699566/city-17482.mp4?width=640&hash=28ab35afdbbf8afc5c589b26de27d04dbe88abf2',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1000&auto=format&fit=crop',
    title: 'City Traffic Timelapse',
    CreatedAt: d(5),
    duration: '0:15'
  },
  {
    id: 'm9',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1683009427513-28e163402d16?q=80&w=1000&auto=format&fit=crop',
    title: 'Modern Architecture',
    CreatedAt: d(5),
  },
  {
    id: 'm10',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687982141-86047eb772e1?q=80&w=1000&auto=format&fit=crop',
    title: 'Climbing expedition',
    CreatedAt: d(6)
  },
  {
    id: 'm11',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687982093-4773cb0dbc2e?q=80&w=1000&auto=format&fit=crop',
    title: 'Lake view',
    CreatedAt: d(6)
  },
  
  // Last Month
  {
    id: 'm12',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682686580922-2e594f8bdaa7?q=80&w=1000&auto=format&fit=crop',
    title: 'Abstract rock formations',
    CreatedAt: d(20)
  },
  {
    id: 'm13',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682686581413-0a0ec9bb35bb?q=80&w=1000&auto=format&fit=crop',
    title: 'Abstract rock formations 2',
    CreatedAt: d(20)
  },
  {
    id: 'm14',
    type: 'video',
    url: 'https://cdn.pixabay.com/vimeo/303975556/stars-19760.mp4?width=640&hash=d1e34199fc4f6a5b678c775caea1ac3d0263fca3',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    title: 'Night Sky',
    CreatedAt: d(25),
    duration: '0:30'
  },
  {
    id: 'm15',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1682687218608-5e2522d046c8?q=80&w=1000&auto=format&fit=crop',
    title: 'Beach morning',
    CreatedAt: d(28)
  }
];

// Grouping utility for macOS Photos style sections
export const groupMediaByDate = (mediaList: MediaItem[]) => {
  const groups: Record<string, MediaItem[]> = {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  mediaList.forEach(m => {
    const mDate = new Date(m.CreatedAt);
    mDate.setHours(0, 0, 0, 0);
    
    let groupKey = '';
    if (mDate.getTime() === today.getTime()) {
      groupKey = '今天';
    } else if (mDate.getTime() === yesterday.getTime()) {
      groupKey = '昨天';
    } else if (today.getTime() - mDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      groupKey = '过去七天';
    } else {
      // e.g. "2026年3月"
      groupKey = `${mDate.getFullYear()}年${mDate.getMonth() + 1}月`;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(m);
  });

  return groups;
};
