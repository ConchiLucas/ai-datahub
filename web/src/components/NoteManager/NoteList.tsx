import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { AppState } from '@/stores/useAppStore';
import type { Note, Directory } from '@/types';
import { getNotebookIdsFromDirectory } from '@/stores/useAppStore';
import { moveNoteToNotebook, searchNotes } from '@/api/note';
import { Star, Trash2, Clock, FileText, ChevronDown, List, LayoutGrid, Check, FolderUp, Layers } from 'lucide-react';

// 去除 HTML 标签，获取纯文本
const stripHtml = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// 高亮文本函数 - 将匹配的文字包裹在黄色背景的 span 中
const highlightText = (text: string, keyword: string): React.ReactNode => {
  if (!keyword || !text) return text;

  const keywordLower = keyword.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(keywordLower);

  if (index === -1) return text;

  return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-500/30 text-light-text dark:text-dark-text">
        {text.slice(index, index + keyword.length)}
      </span>
        {text.slice(index + keyword.length)}
      </>
  );
};

// 提取到外部，避免每次渲染重建
const ListHeader = ({
                      selectedTagName,
                      tags,
                      filteredNotesLength,
                      isEmpty,
                      isNoSearchResult,
                      viewMode,
                      setViewMode,
                      selectedTag,
                      selectTag,
                      searchKeyword,
                      setSearchKeyword,
                      sortBy,
                      setSortBy,
                      sortOrder,
                      setSortOrder,
                      showSortMenu,
                      setShowSortMenu,
                      createNote,
                    }: {
  selectedTagName: string | null;
  tags: any[];
  filteredNotesLength: number;
  isEmpty: boolean;
  isNoSearchResult: boolean;
  viewMode: 'list' | 'card';
  setViewMode: (mode: 'list' | 'card') => void;
  selectedTag: any | null;
  selectTag: (tag: string | null) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  sortBy: 'time' | 'wordCount';
  setSortBy: (sort: 'time' | 'wordCount') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  showSortMenu: boolean;
  setShowSortMenu: (show: boolean) => void;
  createNote: () => Promise<void>;
}) => {
  return (
      <div className="p-4 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* 主标题 */}
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {selectedTag ? selectedTag.name : '笔记'}
            </h2>
            {/* 笔记数量徽章 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 border border-violet-500/20 dark:border-violet-500/30">
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                {!isEmpty && !isNoSearchResult ? filteredNotesLength : '0'}
              </span>
              <span className="text-xs text-violet-500/70 dark:text-violet-400/70">篇</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* 如果正在按标签过滤，显示清除按钮 */}
            {selectedTag && (
                <button
                    onClick={() => selectTag(null)}
                    className="px-2 py-1 rounded text-xs text-light-text-secondary dark:text-dark-text-secondary
                       hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                >
                  清除筛选
                </button>
            )}
            <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                        ? 'bg-light-bg dark:bg-dark-card text-brand-500'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-card'
                }`}
            >
              <List size={18} />
            </button>
            <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded transition-colors ${
                    viewMode === 'card'
                        ? 'bg-light-bg dark:bg-dark-card text-brand-500'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-card'
                }`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-2">
          <div className="relative">
            <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索笔记关键词..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border
                     text-light-text dark:text-dark-text text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            {/* 清空按钮 */}
            {searchKeyword && (
                <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
            )}
            <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* 新建笔记按钮和排序 */}
        <div className="flex items-center gap-2 mb-2">
          <button
              onClick={createNote}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新建笔记
          </button>
          <div className="relative">
            <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-card transition-colors text-sm border border-light-border dark:border-dark-border"
            >
              <span>{sortBy === 'time' ? '时间' : '字数'}</span>
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-modal z-20">
                    <button
                        onClick={() => { setSortBy('time'); setShowSortMenu(false); }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card"
                    >
                      <span>时间</span>
                      {sortBy === 'time' && <Check size={14} className="text-brand-500" />}
                    </button>
                    <button
                        onClick={() => { setSortBy('wordCount'); setShowSortMenu(false); }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card"
                    >
                      <span>字数</span>
                      {sortBy === 'wordCount' && <Check size={14} className="text-brand-500" />}
                    </button>
                    <div className="border-t border-light-border dark:border-dark-border my-1" />
                    <button
                        onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setShowSortMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card"
                    >
                      <span>{sortOrder === 'asc' ? '升序' : '降序'}</span>
                    </button>
                  </div>
                </>
            )}
          </div>
        </div>
      </div>
  );
};

// 提取到外部
const NoteListItem = ({
                        note,
                        isActive,
                        onClick,
                        onDelete,
                        onMove,
                        onToggleFavorite,
                        searchKeyword,
                      }: {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMove: (e: React.MouseEvent) => void;
  onToggleFavorite: (noteId: string) => void;
  searchKeyword?: string;
}) => {
  const timeAgo = useMemo(() => {
    const date = new Date(note.updatedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  }, [note.updatedAt]);

  const plainTextContent = stripHtml(note.content);
  const displayContent = searchKeyword && note.searchContext
      ? stripHtml(note.searchContext)
      : plainTextContent;

  return (
      <div
          onClick={onClick}
          className={`group relative p-4 cursor-pointer transition-all hover:bg-light-bg dark:hover:bg-dark-card
        ${isActive ? 'bg-light-bg dark:bg-dark-card border-l-2 border-brand-500' : ''}`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-light-text dark:text-dark-text text-sm truncate mb-1">
              {searchKeyword ? highlightText(note.title || '无题', searchKeyword) : (note.title || '无题')}
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-3">
              {searchKeyword
                  ? highlightText(displayContent.slice(0, 300) || '无内容', searchKeyword)
                  : (displayContent.slice(0, 200) || '无内容')}
            </p>
            <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
              {note.tags.length > 0 && (
                  <div className="flex gap-1">
                    {note.tags.slice(0, 2).map((tag: string) => (
                        <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500"
                        >
                    {tag}
                  </span>
                    ))}
                  </div>
              )}
            </div>
          </div>

          <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`flex-shrink-0 p-1 rounded transition-colors ${
                  note.isFavorite
                      ? 'text-warning'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-warning'
              }`}
          >
            <Star size={14} fill={note.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
              onClick={onMove}
              className="p-1 rounded text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-500 transition-colors
                     bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm"
              title="移动到其他笔记本"
          >
            <FolderUp size={13} />
          </button>
          <button
              onClick={onDelete}
              className="p-1 rounded text-light-text-secondary dark:text-dark-text-secondary hover:text-error transition-colors
                     bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm"
              title="删除笔记"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
  );
};

// 提取到外部
const NoteCard = ({
                    note,
                    isActive,
                    onClick,
                    onToggleFavorite,
                    searchKeyword,
                  }: {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: (noteId: string) => void;
  searchKeyword?: string;
}) => {
  const timeAgo = useMemo(() => {
    const date = new Date(note.updatedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  }, [note.updatedAt]);

  const plainTextContent = stripHtml(note.content);
  const displayContent = searchKeyword && note.searchContext
      ? stripHtml(note.searchContext)
      : plainTextContent;

  return (
      <div
          onClick={onClick}
          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-cardHover
        ${isActive
              ? 'border-brand-500 bg-light-bg dark:bg-dark-card'
              : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card'
          }`}
      >
        <h3 className="font-medium text-light-text dark:text-dark-text text-sm truncate mb-2">
          {searchKeyword ? highlightText(note.title || '无题', searchKeyword) : (note.title || '无题')}
        </h3>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-3 mb-2">
          {searchKeyword
              ? highlightText(displayContent.slice(0, 100) || '无内容', searchKeyword)
              : (displayContent.slice(0, 60) || '无内容')}
        </p>
        <div className="flex items-center justify-between">
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
          <Clock size={12} />
          {timeAgo}
        </span>
          <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className="p-1"
          >
            <Star
                size={12}
                className={note.isFavorite ? 'text-warning' : 'text-light-text-secondary dark:text-dark-text-secondary'}
                fill={note.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
  );
};

// 提取到外部
const MoveNoteModal = ({
                         noteId,
                         directories,
                         onClose,
                         onMove,
                       }: {
  noteId: string | null;
  directories: Directory[];
  onClose: () => void;
  onMove: (notebookId: number) => Promise<void>;
}) => {
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const findNotebooks = useCallback((dirs: Directory[]): Directory[] => {
    let notebooks: Directory[] = [];
    for (const dir of dirs) {
      if (dir.type === 'note') {
        notebooks.push(dir);
      }
      if (dir.children) {
        notebooks = notebooks.concat(findNotebooks(dir.children));
      }
    }
    return notebooks;
  }, []);

  const notebooks = useMemo(() => findNotebooks(directories), [directories, findNotebooks]);

  const handleMove = async () => {
    if (!selectedNotebookId) return;
    setIsMoving(true);
    try {
      await onMove(selectedNotebookId);
    } finally {
      setIsMoving(false);
      onClose();
    }
  };

  return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
          <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
            移动笔记到其他笔记本
          </h3>

          {notebooks.length === 0 ? (
              <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                暂无可用的笔记本
              </div>
          ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notebooks.map((notebook) => (
                    <button
                        key={notebook.id}
                        onClick={() => setSelectedNotebookId(notebook.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-sm
                  ${selectedNotebookId === notebook.id
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card'
                        }`}
                    >
                      <FileText size={18} className={selectedNotebookId === notebook.id ? 'text-brand-500' : 'text-light-text-secondary dark:text-dark-text-secondary'} />
                      <span className="flex-1 text-left">{notebook.name}</span>
                      {selectedNotebookId === notebook.id && <Check size={16} className="text-brand-500" />}
                    </button>
                ))}
              </div>
          )}

          <div className="flex gap-3 mt-6 justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
            >
              取消
            </button>
            <button
                onClick={handleMove}
                disabled={!selectedNotebookId || isMoving}
                className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMoving ? '移动中...' : '确定'}
            </button>
          </div>
        </div>
      </div>
  );
};

export default function NoteList() {
  const notes = useAppStore((state: AppState) => state.notes);
  const setNotes = useAppStore((state: AppState) => state.setNotes);
  const loadNotes = useAppStore((state: AppState) => state.loadNotes);
  const currentNoteId = useAppStore((state: AppState) => state.currentNoteId);
  const tags = useAppStore((state: AppState) => state.tags);
  const selectTag = useAppStore((state: AppState) => state.selectTag);
  const selectNote = useAppStore((state: AppState) => state.selectNote);
  const deleteNote = useAppStore((state: AppState) => state.deleteNote);
  const toggleFavorite = useAppStore((state: AppState) => state.toggleFavorite);
  const setSearchKeywordStore = useAppStore((state: AppState) => state.setSearchKeyword);
  const selectedTagName = useAppStore((state: AppState) => state.selectedTagName);
  const directories = useAppStore((state: AppState) => state.directories);
  const createNote = useCallback(async () => {
    await useAppStore.getState().createNote();
  }, []);

  // 用 ref 存储函数，避免依赖变化触发 effect
  const loadNotesRef = useRef(loadNotes);
  loadNotesRef.current = loadNotes;
  const setNotesRef = useRef(setNotes);
  setNotesRef.current = setNotes;
  const setSearchKeywordStoreRef = useRef(setSearchKeywordStore);
  setSearchKeywordStoreRef.current = setSearchKeywordStore;
  const selectNoteRef = useRef(selectNote);
  selectNoteRef.current = selectNote;

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadDoneRef = useRef(false);  // 标记初始加载是否完成

  // 排序状态
  const [sortBy, setSortBy] = useState<'time' | 'wordCount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 视图模式
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // 移动笔记弹窗状态
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [noteToMoveId, setNoteToMoveId] = useState<string | null>(null);

  // 优化防抖逻辑，修复清空搜索框不触发的问题
  useEffect(() => {
    // 更新全局搜索关键词
    setSearchKeywordStoreRef.current(searchKeyword);

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器（无论是否为空都执行）
    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // 搜索关键词为空时，重新加载原始笔记列表
        if (!searchKeyword.trim()) {
          // 首次加载时跳过（HomePage 已经加载过了），避免重复请求
          if (!isInitialLoadDoneRef.current) {
            isInitialLoadDoneRef.current = true;
            setIsSearching(false);
            return;
          }

          // 根据当前选中的笔记本/标签加载原始笔记
          // 使用 getState 获取最新状态，避免依赖 currentNotebookId 和 directories
          const { currentNotebookId, directories, selectedTagName } = useAppStore.getState();
          let notebookIds: number[] | null = null;
          if (currentNotebookId) {
            notebookIds = getNotebookIdsFromDirectory(directories, Number(currentNotebookId));
          }
          await loadNotesRef.current(notebookIds, selectedTagName);
          setIsSearching(false);
          return;
        }

        // 有关键词时，标记首次加载已完成
        isInitialLoadDoneRef.current = true;

        // 有搜索关键词时，执行搜索逻辑
        const { currentNotebookId, directories } = useAppStore.getState();
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

          // 使用队列微任务更新状态，避免阻塞UI
          queueMicrotask(() => {
            setNotes(searchResults);
            if (searchResults.length > 0) {
              setTimeout(() => {
                selectNote(searchResults[0].id, true);
              }, 100);
            }
          });
        }
      } catch (error) {
        console.error('搜索/加载笔记失败:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchKeyword]);

  // 优化排序逻辑，减少计算
  const filteredNotes = useMemo(() => {
    if (!notes.length) return [];

    return [...notes].sort((a: Note, b: Note) => {
      // 收藏优先
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      let comparison = 0;
      switch (sortBy) {
        case 'time':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'wordCount':
          comparison = b.wordCount - a.wordCount;
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [notes, sortBy, sortOrder]);

  const isEmpty = notes.length === 0;
  const isNoSearchResult = notes.length > 0 && filteredNotes.length === 0 && searchKeyword !== '';
  const selectedTag = selectedTagName ? tags.find(t => t.name === selectedTagName) : null;

  if (isEmpty || isNoSearchResult) {
    return (
        <div className="w-80 flex-shrink-0 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-col overflow-hidden">
          <ListHeader
              selectedTagName={selectedTagName}
              tags={tags}
              filteredNotesLength={filteredNotes.length}
              isEmpty={isEmpty}
              isNoSearchResult={isNoSearchResult}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedTag={selectedTag}
              selectTag={selectTag}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              showSortMenu={showSortMenu}
              setShowSortMenu={setShowSortMenu}
              createNote={createNote}
          />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-bg dark:bg-dark-card flex items-center justify-center">
                <FileText size={24} className="text-light-text-secondary dark:text-dark-text-secondary" />
              </div>
              <p className="text-sm text-light-text dark:text-dark-text mb-4">
                {isNoSearchResult ? '没有找到匹配的笔记' : '还没有笔记'}
              </p>
              {isEmpty && (
                  <button
                      onClick={createNote}
                      className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    创建第一篇笔记
                  </button>
              )}
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="w-80 flex-shrink-0 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-col overflow-hidden">
        <ListHeader
            selectedTagName={selectedTagName}
            tags={tags}
            filteredNotesLength={filteredNotes.length}
            isEmpty={isEmpty}
            isNoSearchResult={isNoSearchResult}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedTag={selectedTag}
            selectTag={selectTag}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            showSortMenu={showSortMenu}
            setShowSortMenu={setShowSortMenu}
            createNote={createNote}
        />

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {viewMode === 'list' ? (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {filteredNotes.map((note: Note) => (
                    <NoteListItem
                        key={note.id}
                        note={note}
                        isActive={note.id === currentNoteId}
                        onClick={() => selectNote(note.id)}
                        onDelete={(e) => {
                          e.stopPropagation();
                          if (window.confirm('确定要删除这篇笔记吗？')) {
                            deleteNote(note.id);
                          }
                        }}
                        onMove={(e) => {
                          e.stopPropagation();
                          setNoteToMoveId(note.id);
                          setShowMoveModal(true);
                        }}
                        onToggleFavorite={(noteId) => toggleFavorite(noteId)}
                        searchKeyword={searchKeyword}
                    />
                ))}
              </div>
          ) : (
              <div className="p-4 grid grid-cols-2 gap-3">
                {filteredNotes.map((note: Note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        isActive={note.id === currentNoteId}
                        onClick={() => selectNote(note.id)}
                        onToggleFavorite={(noteId) => toggleFavorite(noteId)}
                        searchKeyword={searchKeyword}
                    />
                ))}
              </div>
          )}
        </div>

        {/* 移动笔记弹窗 */}
        {showMoveModal && noteToMoveId && (
            <MoveNoteModal
                noteId={noteToMoveId}
                directories={directories}
                onClose={() => {
                  setShowMoveModal(false);
                  setNoteToMoveId(null);
                }}
                onMove={async (notebookId: number) => {
                  const result = await moveNoteToNotebook(Number(noteToMoveId), notebookId);
                  if (result.code === 200) {
                    await useAppStore.getState().loadNotes([notebookId]);
                  }
                }}
            />
        )}
      </div>
  );
}