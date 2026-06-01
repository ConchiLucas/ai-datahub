import { useAppStore } from '@/stores/useAppStore';
import type { AppState } from '@/stores/useAppStore';
import type { Note, Tag } from '@/types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import UnderlineExt from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  BookOpen,
  MoreHorizontal,
  Download,
  Share2,
  History,
  Undo,
  Redo,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  CloudOff,
  Loader2,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { updateNoteTags } from '@/api/tag';

// 保存状态类型
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

// 右上角保存状态指示器
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const config = {
    unsaved: {
      icon: <CloudOff size={14} />,
      text: '未保存',
      className: 'text-light-text-secondary dark:text-dark-text-secondary',
    },
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: '保存中',
      className: 'text-brand-500',
    },
    saved: {
      icon: <Check size={14} />,
      text: '已保存',
      className: 'text-green-500',
    },
  }[status];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg
        bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
        transition-all duration-300 select-none ${config.className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

// 标签选择器组件
interface TagSelectorProps {
  noteId: string;
  selectedTagNames: string[];  // 改为标签名称数组
  allTags: Tag[];
  onTagsChange: (tagNames: string[]) => void;  // 传出标签名称数组
  loadTags: () => Promise<void>;
}

function TagSelector({ noteId, selectedTagNames, allTags, onTagsChange, loadTags }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 切换标签选择
  const toggleTag = async (tag: Tag) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const numericNoteId = Number(noteId);

      // 构建新的标签名称列表
      let newTagNames: string[];
      if (selectedTagNames.includes(tag.name)) {
        // 移除标签
        newTagNames = selectedTagNames.filter(name => name !== tag.name);
      } else {
        // 添加标签
        newTagNames = [...selectedTagNames, tag.name];
      }

      const response = await updateNoteTags(numericNoteId, newTagNames);
      if (response.code === 200) {
        onTagsChange(newTagNames);
        await loadTags();
      }
    } catch (error) {
      console.error('更新标签失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除标签
  const removeTag = async (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const numericNoteId = Number(noteId);
      const newTagNames = selectedTagNames.filter(name => name !== tagName);

      const response = await updateNoteTags(numericNoteId, newTagNames);
      if (response.code === 200) {
        onTagsChange(newTagNames);
        await loadTags();
      }
    } catch (error) {
      console.error('移除标签失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取选中的标签对象
  const selectedTagObjects = selectedTagNames
    .map(name => allTags.find(t => t.name === name))
    .filter(Boolean) as Tag[];

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {selectedTagObjects.map((tag) => (
          <div
            key={tag.id}
            className="group relative inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
            }}
          >
            <span>{tag.name}</span>
            <button
              onClick={(e) => removeTag(tag.name, e)}
              className="ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10"
              disabled={isLoading}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* 添加标签按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                     border border-dashed border-light-border dark:border-dark-border
                     text-light-text-secondary dark:text-dark-text-secondary
                     hover:border-brand-500 hover:text-brand-500 transition-colors"
          disabled={isLoading}
        >
          <Plus size={12} />
          <span>标签</span>
        </button>
      </div>

      {/* 标签选择弹窗 - 使用相对定位 */}
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-2 w-64 max-h-72 overflow-y-auto
                     bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border
                     rounded-lg shadow-lg p-3 z-50"
        >
          <div className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            选择标签
          </div>
          {allTags.length === 0 ? (
            <div className="text-center py-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              暂无标签，请在左侧创建
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const isSelected = selectedTagNames.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all
                      ${isSelected
                        ? 'ring-1 ring-offset-1'
                        : 'opacity-70 hover:opacity-100'
                      }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      ['--tw-ring-color' as string]: isSelected ? tag.color : undefined,
                    }}
                  >
                    <span>{tag.name}</span>
                    {tag.noteCount > 0 && (
                      <span className="ml-1 text-light-text-secondary dark:text-dark-text-secondary">
                        {tag.noteCount}
                      </span>
                    )}
                    {isSelected && <Check size={10} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 工具栏按钮组件
function ToolbarButton({
  icon,
  tooltip,
  onClick,
  active = false,
  disabled = false
}: {
  icon: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : active
          ? 'bg-brand-500 text-white'
          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-card hover:text-light-text dark:hover:text-dark-text'
      }`}
    >
      {icon}
    </button>
  );
}

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>['editor'];
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('请输入图片 URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('请输入链接 URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  return (
    <div className="flex items-center justify-between px-6 py-2 border-t border-light-border dark:border-dark-border">
      {/* 左侧：格式工具 */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Bold size={18} />}
          tooltip="粗体 (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        />
        <ToolbarButton
          icon={<Italic size={18} />}
          tooltip="斜体 (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        />
        <ToolbarButton
          icon={<Underline size={18} />}
          tooltip="下划线 (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        />
        <ToolbarButton
          icon={<Strikethrough size={18} />}
          tooltip="删除线"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        />
        <div className="w-px h-6 bg-light-border dark:border-dark-border mx-2" />
        <ToolbarButton
          icon={<Heading1 size={18} />}
          tooltip="标题 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        />
        <ToolbarButton
          icon={<Heading2 size={18} />}
          tooltip="标题 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        />
        <ToolbarButton
          icon={<Heading3 size={18} />}
          tooltip="标题 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        />
        <div className="w-px h-6 bg-light-border dark:border-dark-border mx-2" />
        <ToolbarButton
          icon={<List size={18} />}
          tooltip="无序列表"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        />
        <ToolbarButton
          icon={<ListOrdered size={18} />}
          tooltip="有序列表"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        />
        <div className="w-px h-6 bg-light-border dark:border-dark-border mx-2" />
        <ToolbarButton
          icon={<Quote size={18} />}
          tooltip="引用"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        />
        <ToolbarButton
          icon={<Code size={18} />}
          tooltip="代码块"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        />
        <ToolbarButton
          icon={<LinkIcon size={18} />}
          tooltip="链接"
          onClick={addLink}
          active={editor.isActive('link')}
        />
      </div>

      {/* 中间：插入工具 */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ImageIcon size={18} />}
          tooltip="图片"
          onClick={addImage}
        />
        <ToolbarButton
          icon={<TableIcon size={18} />}
          tooltip="表格"
          onClick={addTable}
        />
        <ToolbarButton
          icon={<Minus size={18} />}
          tooltip="分割线"
          onClick={addHorizontalRule}
        />
      </div>

      {/* 右侧：更多操作 */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Undo size={18} />}
          tooltip="撤销 (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={<Redo size={18} />}
          tooltip="重做 (Ctrl+Y)"
          onClick={() => editor.chain().focus().redo().run()}
        />
        <div className="relative group">
          <ToolbarButton icon={<MoreHorizontal size={18} />} tooltip="更多" />
          <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card">
              <Download size={16} />
              <span>导出</span>
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card">
              <Share2 size={16} />
              <span>分享</span>
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card">
              <History size={16} />
              <span>历史版本</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorArea() {
  const currentNoteId = useAppStore((state: AppState) => state.currentNoteId);
  const notes = useAppStore((state: AppState) => state.notes);
  const tags = useAppStore((state: AppState) => state.tags);
  const loadTags = useAppStore((state: AppState) => state.loadTags);
  const saveNote = useAppStore((state: AppState) => state.saveNote);
  const updateEditingNote = useAppStore((state: AppState) => state.updateEditingNote);
  const editingNote = useAppStore((state: AppState) => state.editingNote);
  const editorRef = useRef<ReturnType<typeof useEditor>['editor']>(null);
  const isSaving = useAppStore((state: AppState) => state.isSaving);
  const [localTitle, setLocalTitle] = useState('');

  // 保存状态：idle | unsaved | saving | saved
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  // 「已保存」状态展示后自动复位的定时器
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖保存定时器
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 标记变更是否来自用户输入（而非加载笔记触发的 setContent）
  const isUserEditing = useRef(false);

  const currentNote = notes.find((n: Note) => n.id === currentNoteId);

  // 监听 isSaving 变化，同步到 saveStatus
  useEffect(() => {
    if (isSaving) {
      // 清除「已保存」复位定时器，防止保存中时被意外重置
      if (savedResetTimer.current) {
        clearTimeout(savedResetTimer.current);
        savedResetTimer.current = null;
      }
      setSaveStatus('saving');
    } else if (saveStatus === 'saving') {
      // isSaving 从 true -> false，说明保存完成
      setSaveStatus('saved');
      // 2 秒后自动回到 idle
      savedResetTimer.current = setTimeout(() => {
        setSaveStatus('idle');
        savedResetTimer.current = null;
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // 切换笔记时重置保存状态
  useEffect(() => {
    if (savedResetTimer.current) {
      clearTimeout(savedResetTimer.current);
      savedResetTimer.current = null;
    }
    setSaveStatus('idle');
  }, [currentNoteId]);

  // 触发防抖保存的通用方法
  const triggerAutoSave = useCallback(() => {
    // 有新的改动，立即标记为「未保存」
    setSaveStatus('unsaved');

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      saveNote();
    }, 300);
  }, [saveNote]);

  // 当切换笔记时，更新本地标题
  useEffect(() => {
    // 当 currentNoteId 变化时，从 editingNote 获取标题
    // 使用 setTimeout 确保 editingNote 已经更新
    const timer = setTimeout(() => {
      if (editingNote) {
        setLocalTitle(editingNote.title || '');
      } else {
        setLocalTitle('');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentNoteId, editingNote]); // 同时监听 currentNoteId 和 editingNote

  // 编辑器内容变更处理
  const handleContentChange = ({ editor }: { editor: ReturnType<typeof useEditor>['editor'] }) => {
    editorRef.current = editor;
    const content = editor.getHTML();

    // 只有用户主动编辑时才触发自动保存，忽略加载笔记时的 setContent
    if (!isUserEditing.current) return;

    updateEditingNote({ content });
    triggerAutoSave();
  };

  // 标题变更处理
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    updateEditingNote({ title: newTitle });
    triggerAutoSave();
  };

  const editor = useEditor({
    editable: true,
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: '开始写作...',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-500 underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: currentNote?.content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-8',
      },
    },
    onUpdate: handleContentChange,
  });

  // 保存笔记的快捷键处理函数
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();

      // 取消正在等待的防抖定时器，立即保存
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }

      if (localTitle !== currentNote?.title) {
        updateEditingNote({ title: localTitle });
      }

      if (editorRef.current) {
        const content = editorRef.current.getHTML();
        updateEditingNote({ content });
      }

      saveNote();
    }
  }, [saveNote, updateEditingNote, localTitle, currentNote?.title]);

  // 当切换笔记时，更新编辑器内容
  useEffect(() => {
    if (editor && currentNoteId) {
      // 使用 editingNote 的完整内容，而不是 currentNote 的截断内容
      const content = editingNote?.content || '';
      if (editor.getHTML() !== content) {
        // 取消上一篇笔记未完成的自动保存
        if (autoSaveTimer.current) {
          clearTimeout(autoSaveTimer.current);
          autoSaveTimer.current = null;
        }

        // 关闭用户编辑标志，防止 setContent 触发自动保存
        isUserEditing.current = false;
        editor.commands.setContent(content);

        // 等待 onUpdate 回调执行完毕后，再开启用户编辑标志
        setTimeout(() => {
          isUserEditing.current = true;
        }, 0);
      }
    }
  }, [currentNoteId, editor, editingNote?.content]);

  // 添加和移除键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 组件卸载时清除所有定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  // 计算字数
  const wordCount = editor?.state.doc.textContent?.length || 0;
  const readTime = Math.ceil(wordCount / 400);

  // 如果没有选中笔记，显示简化的空状态
  if (!currentNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-light-card dark:bg-dark-card flex items-center justify-center">
            <BookOpen size={40} className="text-light-text-secondary dark:text-dark-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-2">选择一篇笔记</h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            从左侧列表中选择一篇笔记开始编辑
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-light-bg dark:bg-dark-bg">
      {/* 编辑器头部 */}
      <div className="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
        {/* 面包屑 + 右上角保存状态 */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <span>
              {editingNote?.groupName
                ? `${editingNote.groupName}/${editingNote.notebookName || '笔记本'}`
                : (editingNote?.notebookName || '笔记本')}
            </span>
          </div>
          {/* 保存状态指示器 */}
          <SaveStatusIndicator status={saveStatus} />
        </div>

        {/* 可编辑的标题输入框 */}
        <div className="px-6 pb-4">
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="无题"
            className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-light-text dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:ring-0"
          />
        </div>

        {/* 工具栏 */}
        <EditorToolbar editor={editor} />
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex-shrink-0 border-t border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card px-6 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            {wordCount} 字 · 约 {readTime} 分钟阅读
          </span>
          {/* 标签选择器 */}
          {currentNoteId && (
            <TagSelector
              noteId={currentNoteId}
              selectedTagNames={editingNote?.tags || currentNote?.tags || []}
              allTags={tags}
              onTagsChange={(newTagNames) => {
                updateEditingNote({ tags: newTagNames });
              }}
              loadTags={loadTags}
            />
          )}
        </div>
      </div>
    </div>
  );
}
