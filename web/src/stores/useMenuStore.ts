import { create } from 'zustand';
import { setUserSetting } from '@/api/auth';

export interface MenuSetting {
  key: string;
  isVisible?: boolean;
  isFavorite?: boolean;
}

const DEFAULT_MENUS: MenuSetting[] = [
  // 📝 内容创作
  { key: 'note', isFavorite: true },
  { key: 'drafts', isFavorite: true },
  { key: 'markdowns' },
  { key: 'novels' },
  { key: 'product-ideas' },
  { key: 'prompts' },
  { key: 'ai-mistakes' },
  // 🛠️ 开发工具
  { key: 'codes', isFavorite: true },
  { key: 'scripts', isFavorite: true },
  { key: 'commands', isFavorite: true },
  { key: 'skills' },
  { key: 'docker' },
  { key: 'json' },
  { key: 'errors' },
  { key: 'guidelines' },
  // 🚀 项目运维
  { key: 'progress', isFavorite: true },
  { key: 'deploy' },
  { key: 'release' },
  { key: 'changelog' },
  { key: 'ports' },
  // 📚 资源管理
  { key: 'file', isFavorite: true },
  { key: 'gallery' },
  { key: 'screenshots' },
  { key: 'materials' },
  { key: 'music' },
  { key: 'software' },
  // 🌐 信息中枢
  { key: 'websites', isFavorite: true },
  { key: 'accounts' },
  { key: 'paths' },
  { key: 'plans' },
  // 📖 学习成长
  { key: 'learning' },
  { key: 'english' },
  { key: 'billing' },
];

const normalizeMenuSetting = (setting: MenuSetting): MenuSetting => ({
  ...setting,
  isVisible: setting.isVisible !== undefined ? setting.isVisible : true,
  isFavorite: setting.isFavorite || false,
});

const DEFAULT_MENU_SETTINGS = DEFAULT_MENUS.map(normalizeMenuSetting);

export interface MenuStore {
  menuSettings: MenuSetting[];
  updateSettings: (newSettings: MenuSetting[]) => Promise<void>;
  hydrate: (originSetting: any) => void;
  resetToDefault: () => Promise<void>;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMenuStore = create<MenuStore>((set) => ({
  menuSettings: [...DEFAULT_MENU_SETTINGS],
  
  // Update UI immediately, then sync to backend
  updateSettings: async (newSettings: MenuSetting[]) => {
    set({ menuSettings: newSettings });
    
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    syncTimeout = setTimeout(async () => {
      try {
        await setUserSetting({ menu_manager: newSettings });
      } catch (error) {
        console.error('Failed to sync menu setting:', error);
      }
    }, 500); // 500ms 防抖
  },
  
  hydrate: (originSetting: any) => {
    if (!originSetting || typeof originSetting !== 'object') {
      set({ menuSettings: [...DEFAULT_MENU_SETTINGS] });
      return;
    }
    
    const mgrSettings = originSetting.menu_manager;
    if (Array.isArray(mgrSettings) && mgrSettings.length > 0) {
      const validSettings = mgrSettings.filter((item: any) => item && item.key);
      if (validSettings.length > 0) {
        // Find default mappings to fill missing properties
        const defaultMap = new Map(DEFAULT_MENUS.map(m => [m.key, m]));
        const mergedSettings = validSettings.map((s: any) => {
          const defaultItem = defaultMap.get(s.key);
          return {
            ...s,
            // Older saved menu data did not include visibility; treat it as visible.
            isVisible: s.isVisible !== undefined ? s.isVisible : true,
            // If isFavorite is missing in backend data, fall back to default
            isFavorite: s.isFavorite !== undefined ? s.isFavorite : (defaultItem?.isFavorite || false)
          };
        });

        // 合并新增的菜单项（后端数据中没有的新模块自动追加到末尾）
        const existingKeys = new Set(mergedSettings.map((s: any) => s.key));
        const newItems = DEFAULT_MENU_SETTINGS.filter(d => !existingKeys.has(d.key));
        set({ menuSettings: [...mergedSettings, ...newItems] });
        return;
      }
    }
    
    set({ menuSettings: [...DEFAULT_MENU_SETTINGS] });
  },

  resetToDefault: async () => {
    set({ menuSettings: [...DEFAULT_MENU_SETTINGS] });
    try {
      await setUserSetting({ menu_manager: DEFAULT_MENU_SETTINGS });
    } catch (error) {
      console.error('Failed to reset menu setting:', error);
    }
  },
}));
