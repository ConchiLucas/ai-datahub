import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import type { User, Note, Notebook, Tag, Attachment, AIMessage, Theme, Directory } from '../types';
import { mockUser, mockNotebooks, mockAttachments, mockAIMessages } from '../data/mockData';
import { login as apiLogin, getUserInfo, logout as apiLogout } from '../api/auth';
import { getDirectoryTree, saveOrUpdateDirectory, deleteDirectory, renameGroup, moveDirectory } from '../api/directory';
import { getNoteList, getNoteById, saveOrUpdateNote, deleteNote as deleteNoteApi, toggleFavorite as toggleFavoriteApi, getNotePage, searchNotes } from '@/api/note';
import { getTagList, createTag, updateTag as updateTagApi, deleteTag as deleteTagApi } from '@/api/tag';
import { useMenuStore } from './useMenuStore';

// 辅助函数：根据目录类型获取笔记本 ID 列表
export const getNotebookIdsFromDirectory = (directories: Directory[], directoryId: number): number[] => {
  const notebookIds: number[] = [];

  // 查找目录
  const findDirectory = (dirs: Directory[], id: number): Directory | null => {
    for (const dir of dirs) {
      if (dir.id === id) return dir;
      if (dir.children) {
        const found = findDirectory(dir.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedDir = findDirectory(directories, directoryId);

  if (!selectedDir) {
    // 如果没找到目录，直接返回单个 ID
    notebookIds.push(directoryId);
    return notebookIds;
  }

  // 递归收集所有笔记本 ID
  const collectNotebookIds = (dir: Directory) => {
    if (dir.children) {
      dir.children.forEach((child) => {
        if (child.type === 'note') {
          notebookIds.push(child.id);
        } else if (child.type === 'group' && child.children) {
          collectNotebookIds(child);
        }
      });
    }
  };

  if (selectedDir.type === 'group' && selectedDir.children) {
    // 是组，递归收集所有子笔记本
    collectNotebookIds(selectedDir);
  } else {
    // 不是组，直接使用当前 ID
    notebookIds.push(selectedDir.id);
  }

  return notebookIds;
};

export interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;

  // 笔记数据
  notes: Note[];
  notebooks: Notebook[];
  tags: Tag[];
  attachments: Attachment[];

  // 目录数据
  directories: Directory[];
  currentDirectoryType: 'note' | 'file' | null;

  // 当前选中
  currentNoteId: string | null;
  currentNotebookId: string | null;
  selectedTagName: string | null; // 当前选中的标签名称

  // UI 状态
  isRightPanelOpen: boolean;
  theme: Theme;
  searchKeyword: string; // 搜索关键词

  // AI 对话
  aiMessages: AIMessage[];
  aiInput: string;

  // 编辑状态
  editingNote: Partial<Note> | null;
  isSaving: boolean;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;

  // 目录相关方法
  loadDirectories: (type: 'note' | 'file') => Promise<void>;
  addDirectory: (directory: Omit<Directory, 'id' | 'createTime' | 'updateTime'> & { notebookId?: number }, skipReload?: boolean) => Promise<number | boolean>;
  deleteDirectory: (directoryId: number) => Promise<boolean>;
  renameDirectory: (directoryId: number, newName: string) => Promise<boolean>;
  moveNotebook: (notebookId: number, groupId: number | null) => Promise<boolean>;

  // 标签相关方法
  loadTags: () => Promise<void>;
  addTag: (tagData: { name: string; color?: string }) => Promise<boolean>;
  updateTag: (tagId: number, tagData: { name: string; color: string }) => Promise<boolean>;
  deleteTag: (tagId: number) => Promise<boolean>;

  // 笔记相关方法
  loadNotes: (notebookIds?: number[] | null, tagName?: string | null, noteId?: string | null) => Promise<Note[]>;
  setNotes: (notes: Note[]) => void;
  fetchNoteById: (noteId: string) => Promise<Note | null>;

  selectNote: (noteId: string | null, isSearchSelect?: boolean) => Promise<void>;
  selectNotebook: (notebookId: string | null, isGroup?: boolean, noteIdToFilter?: string | null) => Promise<void>;
  selectTag: (tagName: string | null) => Promise<void>;

  toggleRightPanel: () => void;
  setTheme: (theme: Theme) => void;
  setSearchKeyword: (keyword: string) => void;

  updateEditingNote: (updates: Partial<Note>) => void;
  saveNote: () => void;
  createNote: () => void;
  deleteNote: (noteId: string) => void;

  // 切换笔记收藏状态
  toggleFavorite: (noteId: string) => Promise<void>;

  sendAIMessage: (content: string) => void;
  clearAIMessages: () => void;
}

const storeImpl: StateCreator<AppState> = (set, get) => {
  // 同步标志，防止快速点击笔记列表时的竞态条件（不依赖 zustand state，避免异步问题）
  let isSelectingNote = false;

  return {
  // 初始状态
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  notes: [],
  notebooks: mockNotebooks,
  tags: [],
  attachments: mockAttachments,

  directories: [],
  currentDirectoryType: null,

  currentNoteId: null,
  currentNotebookId: null,
  selectedTagName: null,

  isRightPanelOpen: true,
  theme: 'dark',
  searchKeyword: '',

  aiMessages: mockAIMessages,
  aiInput: '',

  editingNote: null,
  isSaving: false,

  // 加载笔记列表
  loadNotes: async (notebookIds?: number[] | null, tagName?: string | null, noteId?: string | null) => {
    try {
      const response = await getNoteList(notebookIds, tagName, noteId);
      if (response.code === 200 && response.data) {
        // 转换后端数据格式到前端 Note 类型
        const notesData = response.data.map((item: any) => ({
          id: String(item.id),
          title: item.title || '',
          content: item.content || '',
          notebookId: item.notebook_id ? String(item.notebook_id) : undefined,
          tags: item.tags ? item.tags.split(',').filter((t: string) => t) : [],
          isFavorite: item.isFavorite === 1 || item.isFavorite === true,
          isArchived: false,
          createdAt: item.createTime || new Date().toISOString(),
          updatedAt: item.updateTime || new Date().toISOString(),
          wordCount: item.wordCount ?? item.content?.length ?? 0,
        }));
        set({ notes: notesData });
        // 返回加载的笔记数据，供调用者使用
        return notesData;
      }
      return [];
    } catch (error) {
      console.error('加载笔记失败:', error);
      return [];
    }
  },

  // 设置笔记列表（用于搜索结果）
  setNotes: (notes: Note[]) => {
    set({ notes });
  },

  // 根据 ID 获取笔记详情（应用动态高亮）
  fetchNoteById: async (noteId: string) => {
    try {
      const response = await getNoteById(Number(noteId));
      if (response.code === 200 && response.data) {
        const item = response.data;

        // 获取需要高亮的关键字（可以从配置、环境变量或固定列表获取）
        const keywordsToHighlight = ['重要', '关键', '注意', 'TODO', 'FIXME'];

        // 在返回前应用动态高亮（只对纯文本内容高亮）
        let contentWithHighlights = item.content || '';

        // 如果内容是纯文本（不是 HTML），应用高亮
        if (contentWithHighlights && !contentWithHighlights.includes('<')) {
          // 需要导入 applyDynamicHighlights，暂时注释掉
          // contentWithHighlights = applyDynamicHighlights(contentWithHighlights, keywordsToHighlight);
        }

        return {
          id: String(item.id),
          title: item.title || '',
          content: contentWithHighlights,  // 返回带高亮的内容
          notebookId: item.notebook_id ? String(item.notebook_id) : undefined,
          notebookName: item.notebookName,  // 笔记本名称
          groupName: item.groupName,        // 组名称
          tags: item.tags ? item.tags.split(',').filter((t: string) => t) : [],
          isFavorite: false,
          isArchived: false,
          createdAt: item.createTime || new Date().toISOString(),
          updatedAt: item.updateTime || new Date().toISOString(),
          wordCount: item.wordCount ?? item.content?.length ?? 0,
        } as Note;
      }
      return null;
    } catch (error) {
      console.error('获取笔记详情失败:', error);
      return null;
    }
  },

  // 加载目录
  loadDirectories: async (type: 'note' | 'file') => {
    try {
      const response = await getDirectoryTree();
      if (response.code === 200 && response.data) {
        set({
          directories: response.data,
          currentDirectoryType: type,
        });
      }
    } catch (error) {
      console.error('加载目录失败:', error);
    }
  },

  // 新增目录
  addDirectory: async (directory: Omit<Directory, 'id' | 'createTime' | 'updateTime'> & { notebookId?: number }, skipReload = false) => {
    try {
      const response = await saveOrUpdateDirectory({
        name: directory.name,
        type: directory.type,
        parentId: directory.parentId,
        sortNum: directory.sortNum || 0,
        notebookId: directory.notebookId,  // 保留 notebookId 参数
      });
      if (response.code === 200) {
        // 如果不跳过重新加载，则重新加载目录
        if (!skipReload) {
          const { currentDirectoryType } = get();
          if (currentDirectoryType) {
            await get().loadDirectories(currentDirectoryType);
          }
        }
        // 返回创建的目录 ID（如果有的话）- 后端返回数据结构：{ code: 200, data: { id: xxx } }
        return response.data?.id || true;
      }
      return false;
    } catch (error) {
      console.error('新增目录失败:', error);
      return false;
    }
  },

  // 删除目录
  deleteDirectory: async (directoryId: number) => {
    try {
      const response = await deleteDirectory(String(directoryId));
      if (response.code === 200) {
        // 重新加载目录
        const { currentDirectoryType } = get();
        if (currentDirectoryType) {
          await get().loadDirectories(currentDirectoryType);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除目录失败:', error);
      return false;
    }
  },

  // 重命名目录
  renameDirectory: async (directoryId: number, newName: string) => {
    try {
      const response = await renameGroup(directoryId, newName);
      if (response.code === 200) {
        // 重新加载目录
        const { currentDirectoryType } = get();
        if (currentDirectoryType) {
          await get().loadDirectories(currentDirectoryType);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('重命名目录失败:', error);
      return false;
    }
  },

  // 移动笔记本到组（或解除关联）
  moveNotebook: async (notebookId: number, groupId: number | null) => {
    try {
      // 从 directories 中查找笔记本的名称
      const { directories } = get();
      const findDirectory = (dirs: Directory[], id: number): Directory | null => {
        for (const dir of dirs) {
          if (dir.id === id) return dir;
          if (dir.children) {
            const found = findDirectory(dir.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const notebook = findDirectory(directories, notebookId);
      if (!notebook) {
        console.error('未找到笔记本:', notebookId);
        return false;
      }

      const response = await moveDirectory(notebookId, groupId, notebook.name, notebook.type);
      if (response.code === 200) {
        // 重新加载目录
        const { currentDirectoryType } = get();
        if (currentDirectoryType) {
          await get().loadDirectories(currentDirectoryType);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('移动笔记本失败:', error);
      return false;
    }
  },

  // 加载标签列表
  loadTags: async () => {
    try {
      const response = await getTagList();
      if (response.code === 200 && response.data) {
        // 转换后端数据格式到前端 Tag 类型
        const tagsData = response.data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          color: item.color,
          noteCount: item.noteCount || 0,
          userId: item.userId ? String(item.userId) : undefined,
        }));
        set({ tags: tagsData });
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  },

  // 添加标签
  addTag: async (tagData: { name: string; color?: string }) => {
    try {
      const response = await createTag({ name: tagData.name });
      if (response.code === 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('添加标签失败:', error);
      return false;
    }
  },

  // 更新标签
  updateTag: async (tagId: number, tagData: { name: string; color: string }) => {
    try {
      const response = await updateTagApi(tagId, { name: tagData.name, color: tagData.color });
      if (response.code === 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新标签失败:', error);
      return false;
    }
  },

  // 删除标签
  deleteTag: async (tagId: number) => {
    try {
      const response = await deleteTagApi(tagId);
      if (response.code === 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  },

  // 登录
  login: async (username: string, password: string) => {
    try {
      const response = await apiLogin({ username, password });
      // 保存 token 到 localStorage
      localStorage.setItem('token', response.token);
      // 更新用户状态
      set({
        user: {
          id: String(response.user_info.id),
          email: response.user_info.username,
          name: response.user_info.username,
          isPremium: false,
        },
        isAuthenticated: true,
      });
      useMenuStore.getState().hydrate(response.user_info.origin_setting);
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  },

  // 登出
  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, currentNoteId: null });
    }
  },

  // 初始化认证状态（从 localStorage 恢复 token 并获取用户信息）
  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userInfo = await getUserInfo();
        set({
          user: {
            id: String(userInfo.id),
            email: userInfo.username,
            name: userInfo.username,
            isPremium: false,
          },
          isAuthenticated: true,
          isInitializing: false,
        });
        useMenuStore.getState().hydrate(userInfo.origin_setting);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    } else {
      set({ isInitializing: false });
    }
  },

  // 选择笔记
  selectNote: async (noteId: string | null, isSearchSelect?: boolean) => {
    const state = get();
    const { editingNote, currentNoteId, currentNotebookId, notes } = state;

    // 如果有正在编辑的笔记且与当前选中的不同
    // 只有在编辑器失去焦点时才保存，这里不自动保存
    // 如果是搜索选中，跳过保存逻辑
    if (noteId === currentNoteId) {
      // 点击的是同一个笔记，直接返回
      return;
    }

    if (!noteId) {
      // 清空选中
      set({
        currentNoteId: null,
        editingNote: null,
      });
      return;
    }

    // 无论列表中是否存在，都通过 API 获取完整详情（因为列表返回的内容是截断的）
    const fullNote = await state.fetchNoteById(noteId);
    if (fullNote) {
      // 保留原有的 searchContext（搜索结果中的上下文）
      const existingNote = notes.find((n: Note) => n.id === noteId);
      set({
        currentNoteId: noteId,
        editingNote: { ...fullNote, searchContext: existingNote?.searchContext },
      });
    }
  },

  // 选择笔记本（支持点击已选中的笔记本取消选中）
  selectNotebook: async (notebookId: string | null, isGroup?: boolean, noteIdToFilter?: string | null) => {
    const { currentNotebookId, currentNoteId, notes, directories, selectedTagName } = get();

    // 如果点击的是当前已选中的笔记本，取消选中（加载所有笔记）
    if (notebookId && notebookId === currentNotebookId) {
      // 取消选中笔记本，加载所有笔记（保持标签过滤）
      set({ currentNotebookId: null, currentNoteId: null, editingNote: null });

      const { loadNotes } = get();
      const loadedNotes = await loadNotes(null, selectedTagName, noteIdToFilter);

      // 加载完成后，选中笔记
      if (loadedNotes && loadedNotes.length > 0) {
        const firstNote = loadedNotes[0];
        // 调用详情接口获取完整内容（列表数据是截断的）
        const fullNote = await get().fetchNoteById(firstNote.id);
        if (fullNote) {
          set({
            currentNoteId: firstNote.id,
            editingNote: { ...fullNote },
          });
        }
      }
      return;
    }

    // 先清空当前选中的笔记和编辑状态，避免数据污染
    set({ currentNotebookId: notebookId, currentNoteId: null, editingNote: null });

    const { loadNotes } = get();

    let loadedNotes: Note[] = [];

    if (!notebookId) {
      // 没有选择，加载所有笔记（保持标签过滤）
      loadedNotes = await loadNotes(null, selectedTagName, noteIdToFilter);
    } else {
      // 使用公共函数获取笔记本 ID 列表
      const notebookIds = getNotebookIdsFromDirectory(directories, Number(notebookId));
      console.log('【selectNotebook】计算的笔记本 ID 列表:', notebookIds, 'directoryId:', notebookId);
      loadedNotes = await loadNotes(notebookIds, selectedTagName, noteIdToFilter);
    }

    // 加载完成后，选中笔记
    if (loadedNotes && loadedNotes.length > 0) {
      const firstNote = loadedNotes[0];
      // 调用详情接口获取完整内容（列表数据是截断的）
      const fullNote = await get().fetchNoteById(firstNote.id);
      if (fullNote) {
        set({
          currentNoteId: firstNote.id,
          editingNote: { ...fullNote },
        });
      }
    }
  },

  // 选择标签（支持点击已选中的标签取消选中）
  selectTag: async (tagName: string | null) => {
    const { currentNoteId, notes, currentNotebookId, directories } = get();

    // 如果点击的是当前已选中的标签，取消选中
    if (tagName && get().selectedTagName === tagName) {
      set({ selectedTagName: null, currentNoteId: null, editingNote: null });

      // 重新加载笔记（保持笔记本筛选）
      const { loadNotes } = get();
      let notebookIds: number[] | null = null;
      if (currentNotebookId) {
        notebookIds = getNotebookIdsFromDirectory(directories, Number(currentNotebookId));
      }
      const loadedNotes = await loadNotes(notebookIds, null);

      // 加载完成后，选中第一篇笔记
      if (loadedNotes && loadedNotes.length > 0) {
        const firstNote = loadedNotes[0];
        // 调用详情接口获取完整内容（列表数据是截断的）
        const fullNote = await get().fetchNoteById(firstNote.id);
        if (fullNote) {
          set({
            currentNoteId: firstNote.id,
            editingNote: { ...fullNote },
          });
        }
      }
      return;
    }

    // 先清空当前选中的笔记和编辑状态
    set({ selectedTagName: tagName, currentNoteId: null, editingNote: null, currentNotebookId: null });

    if (!tagName) {
      // 没有选择标签，加载所有笔记
      const { loadNotes } = get();
      const loadedNotes = await loadNotes(null, null);

      if (loadedNotes && loadedNotes.length > 0) {
        const firstNote = loadedNotes[0];
        // 调用详情接口获取完整内容（列表数据是截断的）
        const fullNote = await get().fetchNoteById(firstNote.id);
        if (fullNote) {
          set({
            currentNoteId: firstNote.id,
            editingNote: { ...fullNote },
          });
        }
      }
      return;
    }

    // 根据标签名称过滤笔记（使用 list 接口）
    try {
      const { loadNotes } = get();
      const loadedNotes = await loadNotes(null, tagName);

      if (loadedNotes && loadedNotes.length > 0) {
        const firstNote = loadedNotes[0];
        // 调用详情接口获取完整内容（列表数据是截断的）
        const fullNote = await get().fetchNoteById(firstNote.id);
        if (fullNote) {
          set({
            currentNoteId: firstNote.id,
            editingNote: { ...fullNote },
          });
        }
      }
    } catch (error) {
      console.error('根据标签加载笔记失败:', error);
    }
  },

  // 切换右侧面板
  toggleRightPanel: () => {
    set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen }));
  },

  // 设置主题
  setTheme: (theme: Theme) => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  // 设置搜索关键词
  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },

  // 更新编辑中的笔记
  updateEditingNote: (updates: Partial<Note>) => {
    set((state) => {
      const newEditingNote = state.editingNote ? { ...state.editingNote, ...updates } : updates;

      // 如果更新的是标签，同时更新 notes 列表中对应笔记的标签
      let newNotes = state.notes;
      if (updates.tags && state.currentNoteId) {
        newNotes = state.notes.map((note) =>
          note.id === state.currentNoteId
            ? { ...note, tags: updates.tags! }
            : note
        );
      }

      return {
        editingNote: newEditingNote,
        notes: newNotes,
      };
    });
  },

  // 保存笔记（区分新建和更新）
  saveNote: async () => {
    const { editingNote, currentNoteId, currentNotebookId, loadNotes, directories, notes, selectedTagName, searchKeyword } = get();

    // 如果没有 editingNote，但有 currentNoteId，尝试从 notes 列表中获取
    let noteToSave = editingNote;
    if (!noteToSave && currentNoteId) {
      const currentNote = notes.find((n: Note) => n.id === currentNoteId);
      if (currentNote) {
        noteToSave = { ...currentNote };
      }
    }

    if (!noteToSave) return;

    set({ isSaving: true });

    try {
      // 检查是否是新建笔记（ID 以 new_ 开头）
      const isNewNote = currentNoteId?.startsWith('new_');

      // 如果当前选择的是组，需要找到组下的笔记本 ID
      let actualNotebookId: number | undefined = undefined;
      
      // 优先使用 noteToSave 中的 notebookId（新建笔记时设置）
      if (noteToSave.notebookId) {
        actualNotebookId = Number(noteToSave.notebookId);
      } else if (currentNotebookId) {
        const findDirectory = (dirs: any[], id: number): any | null => {
          for (const dir of dirs) {
            if (dir.id === id) return dir;
            if (dir.children) {
              const found = findDirectory(dir.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const selectedDir = findDirectory(directories, Number(currentNotebookId));
        if (selectedDir?.type === 'group') {
          // 递归查找组下第一个笔记本
          const findFirstNotebook = (dir: any): any | null => {
            if (!dir.children) return null;
            for (const child of dir.children) {
              if (child.type === 'note') return child;
              const found = findFirstNotebook(child);
              if (found) return found;
            }
            return null;
          };
          const firstNotebook = findFirstNotebook(selectedDir);
          actualNotebookId = firstNotebook ? firstNotebook.id : undefined;
        } else {
          actualNotebookId = Number(currentNotebookId);
        }
      }

      // 从当前笔记列表中获取 isFavorite 状态
      const currentNote = notes.find((n) => n.id === currentNoteId);

      // 构造符合后端期望的请求数据
      const requestData: any = {
        id: isNewNote ? undefined : Number(currentNoteId),
        title: noteToSave.title || '',
        content: noteToSave.content || '',
        tags: noteToSave.tags?.join(',') || '',
        notebook_id: actualNotebookId,
        is_favorite: currentNote?.isFavorite ? 1 : 0, // 保持收藏状态
        // 如果是新建笔记且有 clientId，传递给后端防止重复创建
        client_id: isNewNote ? noteToSave.clientId : undefined,
      };

      const response = await saveOrUpdateNote(requestData);

      if (response.code === 200) {
        // 如果是新建笔记，后端会返回创建的笔记 ID
        const savedNoteId = response.data?.id ? String(response.data.id) : null;

        // 如果是新建笔记，更新 notes 列表中的临时 ID 为真实 ID
        if (savedNoteId && isNewNote) {
          set((state) => ({
            notes: state.notes.map((n) =>
              n.id === currentNoteId
                ? { ...n, id: savedNoteId, clientId: noteToSave.clientId }
                : n
            ),
          }));
        }

        // 重新加载笔记列表（用于侧边栏显示），但不影响当前编辑的内容
        // 根据是否有搜索关键词，选择不同的刷新方式
        if (searchKeyword && searchKeyword.trim()) {
          // 有搜索关键词时，使用搜索接口刷新
          let notebookIds: number[] | null = null;
          if (currentNotebookId) {
            notebookIds = getNotebookIdsFromDirectory(directories, Number(currentNotebookId));
          }
          const response = await searchNotes(searchKeyword, notebookIds);
          if (response.code === 200 && response.data) {
            const searchResults = response.data.map((item: any) => ({
              id: String(item.id),
              title: item.title || '',
              content: item.content || '',
              searchContext: item.searchContext || '',
              notebookId: item.notebook_id ? String(item.notebook_id) : undefined,
              tags: item.tags ? item.tags.split(',').filter((t: string) => t) : [],
              isFavorite: item.isFavorite === 1 || item.isFavorite === true,
              isArchived: false,
              createdAt: item.createTime || new Date().toISOString(),
              updatedAt: item.updateTime || new Date().toISOString(),
              wordCount: item.wordCount ?? item.content?.length ?? 0,
            }));
            set({ notes: searchResults });
          }
        } else if (currentNotebookId) {
          // 没有搜索关键词，但有选中的笔记本/组
          const notebookIds = getNotebookIdsFromDirectory(directories, Number(currentNotebookId));
          await loadNotes(notebookIds, selectedTagName);
        } else if (selectedTagName) {
          // 没有搜索和笔记本，但有选中的标签
          await loadNotes(null, selectedTagName);
        } else {
          // 没有任何筛选条件，加载所有笔记
          await loadNotes(null, null);
        }

        // 重新加载标签列表，更新标签统计数量
        await get().loadTags();

        // 保存完成后，更新 editingNote 的标签和 ID
        // 不使用列表数据更新 editingNote 的内容（因为列表接口会截断内容）
        let newCurrentNoteId = currentNoteId;
        if (savedNoteId && isNewNote) {
          newCurrentNoteId = savedNoteId;
        }

        // 更新 editingNote，保持内容不变，但更新标签和 ID
        const { editingNote: currentEditingNote } = get();
        if (currentEditingNote) {
          set({
            isSaving: false,
            currentNoteId: newCurrentNoteId,
            editingNote: {
              ...currentEditingNote,
              id: (newCurrentNoteId || currentEditingNote.id) as string,
              tags: noteToSave.tags || [], // 使用最新的标签
            },
          });
        } else {
          set({ isSaving: false, currentNoteId: newCurrentNoteId });
        }
      }
    } catch (error) {
      console.error('保存笔记失败:', error);
      set({ isSaving: false });
    }
  },

  // 创建笔记（只在前端创建，不立即保存到后端）
  createNote: async (notebookId?: string) => {
    const { directories, currentNotebookId } = get();

    // 如果没有传入 notebookId，则默认绑定第一个笔记本
    let defaultNotebookId: string | undefined = undefined;

    if (notebookId) {
      defaultNotebookId = notebookId;
    } else if (currentNotebookId) {
      // 如果当前选中了笔记本/组，需要判断是否是组
      const findDirectory = (dirs: any[], id: number): any | null => {
        for (const dir of dirs) {
          if (dir.id === id) return dir;
          if (dir.children) {
            const found = findDirectory(dir.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const selectedDir = findDirectory(directories, Number(currentNotebookId));
      if (selectedDir?.type === 'group') {
        // 是组，找到组下的第一个笔记本
        const findFirstNotebookInGroup = (dir: any): any | null => {
          if (!dir.children) return null;
          for (const child of dir.children) {
            if (child.type === 'note') return child;
            const found = findFirstNotebookInGroup(child);
            if (found) return found;
          }
          return null;
        };
        const firstNotebookInGroup = findFirstNotebookInGroup(selectedDir);
        if (firstNotebookInGroup) {
          defaultNotebookId = String(firstNotebookInGroup.id);
        }
      } else {
        // 不是组，直接使用当前选中的笔记本 ID
        defaultNotebookId = currentNotebookId;
      }
    } else {
      // 否则使用第一个笔记本
      const findFirstNotebook = (dirs: any[]): any | null => {
        for (const dir of dirs) {
          if (dir.type === 'note') return dir;
          if (dir.children) {
            const found = findFirstNotebook(dir.children);
            if (found) return found;
          }
        }
        return null;
      };
      const firstNotebook = findFirstNotebook(directories);
      if (firstNotebook) {
        defaultNotebookId = String(firstNotebook.id);
      }
    }
    
    const newNote: Note = {
      id: `new_${Date.now()}`, // 使用前缀标记为新建笔记
      clientId: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 客户端唯一标识，防止重复创建
      title: '',
      content: '',
      notebookId: defaultNotebookId,
      tags: [],
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
    };
    set((state) => ({
      notes: [newNote, ...state.notes],
      currentNoteId: newNote.id,
      editingNote: { ...newNote },
    }));
  },

  // 删除笔记
  deleteNote: async (noteId: string) => {
    try {
      const response = await deleteNoteApi(noteId);
      if (response.code === 200) {
        // 从本地状态移除
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== noteId),
          currentNoteId: state.currentNoteId === noteId ? null : state.currentNoteId,
          editingNote: state.currentNoteId === noteId ? null : state.editingNote,
        }));

        // 重新加载标签列表，更新标签统计数量
        const { loadTags } = get();
        await loadTags();
      }
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  },

  // 切换笔记收藏状态
  toggleFavorite: async (noteId: string) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;

    // 计算新的收藏状态
    const newIsFavorite = note.isFavorite ? 0 : 1;

    // 先更新本地状态，提升用户体验
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
      ),
      // 如果当前编辑的笔记就是被收藏的笔记，也需要更新
      editingNote: state.editingNote?.id === noteId
        ? { ...state.editingNote, isFavorite: !state.editingNote.isFavorite }
        : state.editingNote,
    }));

    // 调用后端 API 保存
    try {
      await toggleFavoriteApi(Number(noteId), newIsFavorite);
    } catch (error) {
      // 如果调用失败，回滚本地状态
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
        ),
        editingNote: state.editingNote?.id === noteId
          ? { ...state.editingNote, isFavorite: !state.editingNote.isFavorite }
          : state.editingNote,
      }));
      console.error('更新收藏状态失败:', error);
    }
  },

  // 发送 AI 消息
  sendAIMessage: (content: string) => {
    const userMessage: AIMessage = {
      id: String(Date.now()),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      aiMessages: [...state.aiMessages, userMessage],
      aiInput: '',
    }));

    // Mock AI 回复
    setTimeout(() => {
      const loadingMessage: AIMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      set((state) => ({
        aiMessages: [...state.aiMessages, loadingMessage],
      }));

      // Mock AI 回复内容
      setTimeout(() => {
        const responses = [
          '这是一个很好的问题！让我来详细解答...\n\n根据我的理解，你询问的是关于如何实现某个功能。在 React 中，我们通常可以使用以下几种方法：\n\n1. **使用 useState** - 管理组件状态\n2. **使用 useEffect** - 处理副作用\n3. **使用自定义 Hook** - 复用逻辑\n\n你需要更具体的帮助吗？',
          '我来帮你总结这篇笔记的要点：\n\n📌 **核心主题**: 技术学习笔记\n\n🔑 **关键知识点**:\n- React Hooks 的使用方式\n- 最佳实践和注意事项\n- 实际应用场景\n\n有需要深入了解的部分吗？',
          '我已经理解了你的需求。这里是翻译结果：\n\n---\n\nThis is a comprehensive guide about modern web development practices, covering component architecture, state management, and performance optimization techniques.',
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        set((state) => ({
          aiMessages: state.aiMessages.map((m: AIMessage) =>
            m.id === loadingMessage.id
              ? { ...m, content: randomResponse, isLoading: false }
              : m
          ),
        }));
      }, 1500);
    }, 100);
  },

  // 清空 AI 消息
  clearAIMessages: () => {
    set({ aiMessages: mockAIMessages });
  },
  };
};

export const useAppStore = create<AppState>(storeImpl);
