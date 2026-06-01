import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import type { AppState } from '@/stores/useAppStore';
import type { Notebook, Tag, Directory } from '@/types';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Folder,
  Tag as TagIcon,
  FileText,
  LogOut,
  User,
  ChevronRight,
  MoreHorizontal,
  Layers,
  BookOpen,
  Edit2,
  Check,
  X,
  Trash2,
  Save,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { changePassword, type ChangePasswordParams } from '@/api/auth';
import { vectorSearchNotes, type VectorSearchResult } from '@/api/note';

interface MainLayoutProps {
  children: React.ReactNode;
  activeManageType?: 'note' | 'file';
  handleManageClick?: (type: 'note' | 'file') => void;
}

// 右键菜单状态类型
interface ContextMenuState {
  visible: boolean;
  directoryId: number | null;
  x: number;
  y: number;
}

export default function MainLayout({ children, activeManageType: externalActiveManageType, handleManageClick: externalHandleManageClick }: MainLayoutProps) {
  // 如果外部没有传入，则使用默认值
  const activeManageType = externalActiveManageType || 'note';
  const handleManageClick = externalHandleManageClick || (() => {});
  const deleteDirectory = useAppStore((state: AppState) => state.deleteDirectory);
  const loadDirectories = useAppStore((state: AppState) => state.loadDirectories);
  const addDirectory = useAppStore((state: AppState) => state.addDirectory);
  const renameDirectory = useAppStore((state: AppState) => state.renameDirectory);
  const moveNotebook = useAppStore((state: AppState) => state.moveNotebook);
  const currentDirectoryType = useAppStore((state: AppState) => state.currentDirectoryType);
  const directories = useAppStore((state: AppState) => state.directories);

  // 标签相关状态和方法
  const tags = useAppStore((state: AppState) => state.tags);
  const addTag = useAppStore((state: AppState) => state.addTag);
  const updateTag = useAppStore((state: AppState) => state.updateTag);
  const deleteTag = useAppStore((state: AppState) => state.deleteTag);
  const loadTags = useAppStore((state: AppState) => state.loadTags);

  // 标签弹窗状态
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#4F46E5');

  // 编辑标签状态
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [showEditTagModal, setShowEditTagModal] = useState(false);

  // 右键菜单状态 - 提升到这里确保菜单在最外层渲染
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    directoryId: null,
    x: 0,
    y: 0,
  });

  // 创建组弹窗状态
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupParentDirectoryId, setGroupParentDirectoryId] = useState<number | null>(null);

  // 创建笔记本弹窗状态
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [notebookParentGroupId, setNotebookParentGroupId] = useState<number | null>(null);

  // 重命名组弹窗状态
  const [showRenameGroup, setShowRenameGroup] = useState(false);
  const [renameGroupId, setRenameGroupId] = useState<number | null>(null);
  const [newGroupNameValue, setNewGroupNameValue] = useState('');

  // 重命名笔记本弹窗状态
  const [showRenameNotebook, setShowRenameNotebook] = useState(false);
  const [renameNotebookId, setRenameNotebookId] = useState<number | null>(null);
  const [newNotebookNameValue, setNewNotebookNameValue] = useState('');

  // 移动到组弹窗状态
  const [showMoveToGroup, setShowMoveToGroup] = useState(false);
  const [moveNotebookId, setMoveNotebookId] = useState<number | null>(null);

  // 加载标签
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  // 处理删除目录
  const handleDeleteDirectory = async (directoryId: number) => {
    if (!confirm('确定要删除此组吗？如果组中包含笔记本，将无法删除。')) return;

    const success = await deleteDirectory(directoryId);
    if (success) {
      setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开创建组弹窗
  const handleCreateGroup = () => {
    if (contextMenu.directoryId) {
      setGroupParentDirectoryId(contextMenu.directoryId);
      setShowCreateGroup(true);
      setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
    }
  };

  // 处理创建组
  const handleConfirmCreateGroup = async () => {
    if (!newGroupName.trim() || groupParentDirectoryId === null) return;

    // 1. 创建组，同时传递笔记本 ID，让后端将笔记本移动到组下
    const result = await addDirectory({
      name: newGroupName.trim(),
      type: 'group',
      parentId: null,
      sortNum: 0,
      notebookId: groupParentDirectoryId,
    }, true);

    if (result) {
      setNewGroupName('');
      setGroupParentDirectoryId(null);
      setShowCreateGroup(false);

      // 2. 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开创建笔记本弹窗
  const handleCreateNotebook = () => {
    if (contextMenu.directoryId) {
      setNotebookParentGroupId(contextMenu.directoryId);
      setShowCreateNotebook(true);
      setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
    }
  };

  // 处理创建笔记本
  const handleConfirmCreateNotebook = async () => {
    if (!newNotebookName.trim() || notebookParentGroupId === null) return;

    const success = await addDirectory({
      name: newNotebookName.trim(),
      type: 'note',
      parentId: notebookParentGroupId,  // 笔记本直接放在组下
      sortNum: 0,
    });

    if (success) {
      setNewNotebookName('');
      setNotebookParentGroupId(null);
      setShowCreateNotebook(false);
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开重命名组弹窗
  const handleRenameGroup = (groupId: number, currentName: string) => {
    setRenameGroupId(groupId);
    setNewGroupNameValue(currentName);
    setShowRenameGroup(true);
    setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
  };

  // 处理重命名组
  const handleConfirmRenameGroup = async () => {
    if (!newGroupNameValue.trim() || renameGroupId === null) return;

    const success = await renameDirectory(renameGroupId, newGroupNameValue.trim());

    if (success) {
      setNewGroupNameValue('');
      setRenameGroupId(null);
      setShowRenameGroup(false);
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开重命名笔记本弹窗
  const handleRenameNotebook = (notebookId: number, currentName: string) => {
    setRenameNotebookId(notebookId);
    setNewNotebookNameValue(currentName);
    setShowRenameNotebook(true);
    setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
  };

  // 处理重命名笔记本
  const handleConfirmRenameNotebook = async () => {
    if (!newNotebookNameValue.trim() || renameNotebookId === null) return;

    const success = await renameDirectory(renameNotebookId, newNotebookNameValue.trim());

    if (success) {
      setNewNotebookNameValue('');
      setRenameNotebookId(null);
      setShowRenameNotebook(false);
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开移动到组弹窗
  const handleMoveToGroup = (notebookId: number) => {
    setMoveNotebookId(notebookId);
    setShowMoveToGroup(true);
    setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 });
  };

  // 处理移动到组
  const handleConfirmMoveToGroup = async (groupId: number | null) => {
    if (moveNotebookId === null) return;

    // 移动笔记本到组（或解除关联）
    const success = await moveNotebook(moveNotebookId, groupId);

    if (success) {
      setMoveNotebookId(null);
      setShowMoveToGroup(false);
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 解除笔记本与组的关联
  const handleRemoveFromGroup = async (notebookId: number) => {
    if (!confirm('确定要将此笔记本从组中移除吗？')) return;

    const success = await moveNotebook(notebookId, null);

    if (success) {
      // 重新加载目录
      if (currentDirectoryType) {
        await loadDirectories(currentDirectoryType);
      }
    }
  };

  // 打开标签管理弹窗
  const handleOpenTagModal = () => {
    setTagName('');
    setShowTagModal(true);
  };

  // 保存标签（新增）- 不关闭弹窗，实时显示
  const handleSaveTag = async () => {
    if (!tagName.trim()) return;

    try {
      await addTag({
        name: tagName.trim(),
      });

      // 重新加载标签列表，不关闭弹窗
      await loadTags();
      // 清空输入框
      setTagName('');
    } catch (error) {
      console.error('保存标签失败:', error);
      alert('保存标签失败，请重试');
    }
  };

  // 打开编辑标签弹窗
  const handleOpenEditTagModal = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
    setShowEditTagModal(true);
  };

  // 保存编辑的标签
  const handleSaveEditTag = async () => {
    if (!editingTag || !editTagName.trim()) return;

    try {
      await updateTag(Number(editingTag.id), {
        name: editTagName.trim(),
        color: editTagColor,
      });

      // 重新加载标签列表
      await loadTags();
      // 关闭编辑弹窗
      setShowEditTagModal(false);
      setEditingTag(null);
      setEditTagName('');
      setEditTagColor('');
    } catch (error) {
      console.error('更新标签失败:', error);
      alert('更新标签失败，请重试');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('确定要删除此标签吗？')) return;

    try {
      await deleteTag(tagId);
      // 重新加载标签列表
      await loadTags();
    } catch (error: any) {
      console.error('删除标签失败:', error);
      alert(error.message || '删除标签失败，请重试');
    }
  };

  return (
      <div className="h-screen w-screen flex flex-col bg-light-bg dark:bg-dark-bg overflow-hidden">
        {/* 顶部导航栏 */}
        <TopNav activeManageType={activeManageType} handleManageClick={handleManageClick} />

        {/* 主体内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧边栏 - 仅在笔记管理模式下显示 */}
          {activeManageType === 'note' && (
          <aside
              className="flex-shrink-0 w-72 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card
                      overflow-hidden flex flex-col"
          >
            <LeftSidebar
                onContextMenu={(id, x, y) => setContextMenu({ visible: true, directoryId: id, x, y })}
                onOpenTagModal={handleOpenTagModal}
                activeManageType={activeManageType}
            />
          </aside>
          )}

          {/* 中间内容区 */}
          <main className={`flex-1 flex overflow-hidden ${activeManageType === 'file' ? 'w-full' : ''}`}>
            {children}
          </main>
        </div>

        {/* 右键菜单 - 放在最外层，避免被裁剪 */}
        {contextMenu.visible && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 })} />
              <ContextMenu
                  directoryId={contextMenu.directoryId}
                  x={contextMenu.x}
                  y={contextMenu.y}
                  directories={directories}
                  onCreateGroup={handleCreateGroup}
                  onCreateNotebook={handleCreateNotebook}
                  onRenameGroup={handleRenameGroup}
                  onRenameNotebook={handleRenameNotebook}
                  onMoveToGroup={handleMoveToGroup}
                  onRemoveFromGroup={handleRemoveFromGroup}
                  onDelete={handleDeleteDirectory}
                  onClose={() => setContextMenu({ visible: false, directoryId: null, x: 0, y: 0 })}
              />
            </>
        )}

        {/* 创建组弹窗 */}
        {showCreateGroup && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName('');
                    setGroupParentDirectoryId(null);
                  }}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
                  新建组
                </h3>

                <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmCreateGroup();
                      }
                    }}
                    placeholder="请输入组名"
                    className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                />

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setNewGroupName('');
                        setGroupParentDirectoryId(null);
                      }}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleConfirmCreateGroup}
                      disabled={!newGroupName.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 创建笔记本弹窗 */}
        {showCreateNotebook && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowCreateNotebook(false);
                    setNewNotebookName('');
                    setNotebookParentGroupId(null);
                  }}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
                  新建笔记本
                </h3>

                <input
                    type="text"
                    value={newNotebookName}
                    onChange={(e) => setNewNotebookName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmCreateNotebook();
                      }
                    }}
                    placeholder="请输入笔记本名称"
                    className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                />

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => {
                        setShowCreateNotebook(false);
                        setNewNotebookName('');
                        setNotebookParentGroupId(null);
                      }}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleConfirmCreateNotebook}
                      disabled={!newNotebookName.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 重命名组弹窗 */}
        {showRenameGroup && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowRenameGroup(false);
                    setNewGroupNameValue('');
                    setRenameGroupId(null);
                  }}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
                  重命名组
                </h3>

                <input
                    type="text"
                    value={newGroupNameValue}
                    onChange={(e) => setNewGroupNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmRenameGroup();
                      }
                    }}
                    placeholder="请输入组名"
                    className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                />

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => {
                        setShowRenameGroup(false);
                        setNewGroupNameValue('');
                        setRenameGroupId(null);
                      }}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleConfirmRenameGroup}
                      disabled={!newGroupNameValue.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 重命名笔记本弹窗 */}
        {showRenameNotebook && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowRenameNotebook(false);
                    setNewNotebookNameValue('');
                    setRenameNotebookId(null);
                  }}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
                  重命名笔记本
                </h3>

                <input
                    type="text"
                    value={newNotebookNameValue}
                    onChange={(e) => setNewNotebookNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmRenameNotebook();
                      }
                    }}
                    placeholder="请输入笔记本名称"
                    className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                />

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => {
                        setShowRenameNotebook(false);
                        setNewNotebookNameValue('');
                        setRenameNotebookId(null);
                      }}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleConfirmRenameNotebook}
                      disabled={!newNotebookNameValue.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 移动到组弹窗 */}
        {showMoveToGroup && (
            <MoveToGroupModal
                notebookId={moveNotebookId}
                directories={directories}
                onClose={() => {
                  setShowMoveToGroup(false);
                  setMoveNotebookId(null);
                }}
                onConfirm={handleConfirmMoveToGroup}
            />
        )}

        {/* 标签管理弹窗 */}
        {showTagModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowTagModal(false)}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-light-text dark:text-dark-text">
                    标签管理
                  </h3>
                  <button
                      onClick={() => setShowTagModal(false)}
                      className="p-1 hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    <X size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
                  </button>
                </div>

                {/* 现有标签列表 */}
                <div className="flex-1 overflow-y-auto mb-4">
                  <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    已有标签（点击编辑）
                  </label>
                  {tags.length === 0 ? (
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary py-4 text-center">
                      暂无标签
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: Tag) => (
                        <div
                            key={tag.id}
                            onClick={() => handleOpenEditTagModal(tag)}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium group cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                            title="点击编辑标签"
                        >
                          {tag.name}
                          <span className="ml-1 text-light-text-secondary dark:text-dark-text-secondary">{tag.noteCount}</span>
                          {/* 删除按钮 */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTag(Number(tag.id));
                              }}
                              className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                              title="删除标签"
                          >
                            <Trash2 size={10} className="text-light-text-secondary dark:text-dark-text-secondary" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 新增标签区域 */}
                <div className="border-t border-light-border dark:border-dark-border pt-4">
                  <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    新增标签
                  </label>
                  <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTag();
                          }
                        }}
                        placeholder="请输入标签名称"
                        className="flex-1 px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <button
                        onClick={handleSaveTag}
                        disabled={!tagName.trim()}
                        className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save size={16} />
                      添加
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    标签颜色将根据名称自动生成
                  </p>
                </div>
              </div>
            </div>
        )}

        {/* 编辑标签弹窗 */}
        {showEditTagModal && editingTag && (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowEditTagModal(false)}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-light-text dark:text-dark-text">
                    编辑标签
                  </h3>
                  <button
                      onClick={() => setShowEditTagModal(false)}
                      className="p-1 hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    <X size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 标签名称输入 */}
                  <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                      标签名称
                    </label>
                    <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        placeholder="请输入标签名称"
                        className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                        autoFocus
                    />
                  </div>

                  {/* 标签颜色选择 */}
                  <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      标签颜色
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
                        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#3B82F6',
                        '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E'
                      ].map((color) => (
                        <button
                            key={color}
                            onClick={() => setEditTagColor(color)}
                            className={`w-8 h-8 rounded-full transition-all ${editTagColor === color ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <input
                          type="color"
                          value={editTagColor}
                          onChange={(e) => setEditTagColor(e.target.value)}
                          className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent flex-shrink-0"
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">#</span>
                        <input
                            type="text"
                            value={editTagColor.replace('#', '')}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                              setEditTagColor(`#${value}`);
                            }}
                            placeholder="输入颜色值"
                            className="flex-1 px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text text-sm focus:outline-none focus:border-brand-500 transition-colors uppercase"
                        />
                      </div>
                      <div
                          className="w-10 h-10 rounded-lg border border-light-border dark:border-dark-border flex-shrink-0"
                          style={{ backgroundColor: editTagColor }}
                          title="颜色预览"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => setShowEditTagModal(false)}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleSaveEditTag}
                      disabled={!editTagName.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={16} />
                    保存
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

// 顶部导航栏组件
function TopNav({
  activeManageType,
  handleManageClick
}: {
  activeManageType: 'note' | 'file';
  handleManageClick: (type: 'note' | 'file') => void;
}) {
  const navigate = useNavigate();
  const theme = useAppStore((state: AppState) => state.theme);
  const setTheme = useAppStore((state: AppState) => state.setTheme);
  const logout = useAppStore((state: AppState) => state.logout);
  const user = useAppStore((state: AppState) => state.user);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // 向量搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 文件搜索相关状态
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [fileSearchResults, setFileSearchResults] = useState<{ fileId: string; fileName: string; matchedChunk: string; similarity: number }[]>([]);
  const [showFileSearchDropdown, setShowFileSearchDropdown] = useState(false);
  const [isFileSearching, setIsFileSearching] = useState(false);
  const fileSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 处理搜索输入（带防抖）
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    // 设置新的防抖定时器，500ms 后执行搜索
    searchTimeoutRef.current = setTimeout(() => {
      performVectorSearch(value);
    }, 500);
  };

  // 执行向量搜索
  const performVectorSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await vectorSearchNotes(query, 5, 0.5, false);
      console.log('搜索响应:', response);
      if (response.code === 200 && response.data?.results) {
        setSearchResults(response.data.results);
        setShowSearchDropdown(true);
        console.log('搜索结果:', response.data.results);
      } else {
        console.log('搜索结果为空或code不对:', response);
      }
    } catch (error) {
      console.error('向量搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 点击搜索结果，选中笔记本并过滤到该笔记
  const handleSearchResultClick = async (result: VectorSearchResult) => {
    const { noteId, notebookId } = result;
    console.log('点击搜索结果:', result); // 调试用
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);

    // 清除选中的标签
    const store = useAppStore.getState();
    if (store.selectedTagName) {
      store.selectTag(null);
    }

    if (notebookId) {
      // 选中笔记本，并传入 noteId 进行过滤
      await store.selectNotebook(String(notebookId), false, String(noteId));
    } else {
      // 如果没有笔记本ID，直接跳转到笔记详情
      console.log('没有 notebookId，直接跳转'); // 调试用
      navigate(`/note/${noteId}`);
    }
  };

  // 文件搜索 - 处理搜索输入（带防抖）
  const handleFileSearchInput = (value: string) => {
    setFileSearchQuery(value);

    // 清除之前的定时器
    if (fileSearchTimeoutRef.current) {
      clearTimeout(fileSearchTimeoutRef.current);
    }

    if (!value.trim()) {
      setFileSearchResults([]);
      setShowFileSearchDropdown(false);
      return;
    }

    // 设置新的防抖定时器，500ms 后执行搜索
    fileSearchTimeoutRef.current = setTimeout(() => {
      performFileSearch(value);
    }, 500);
  };

  // 文件搜索 - 执行搜索
  const performFileSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsFileSearching(true);
    try {
      // TODO: 替换为实际的文件向量搜索接口
      // const response = await vectorSearchFiles(query, 5, 0.5);
      const mockResults = [
        { fileId: '1', fileName: '工作文档.docx', matchedChunk: '这是与搜索关键词相关的文件内容片段...', similarity: 0.95 },
        { fileId: '2', fileName: '项目计划.pdf', matchedChunk: '另一个相关的文件内容...', similarity: 0.87 },
      ];
      setFileSearchResults(mockResults);
      setShowFileSearchDropdown(true);
    } catch (error) {
      console.error('文件搜索失败:', error);
    } finally {
      setIsFileSearching(false);
    }
  };

  // 文件搜索 - 点击搜索结果
  const handleFileSearchResultClick = (result: { fileId: string; fileName: string; matchedChunk: string; similarity: number }) => {
    console.log('点击文件搜索结果:', result);
    setFileSearchQuery('');
    setShowFileSearchDropdown(false);
    setFileSearchResults([]);
    // TODO: 跳转到对应文件
  };

  // 点击空白处关闭下拉框
  const handleClickOutside = () => {
    setShowSearchDropdown(false);
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleOpenChangePassword = () => {
    setShowUserMenu(false);
    setShowChangePasswordModal(true);
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <header className="h-14 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex items-center px-4 flex-shrink-0 z-20 justify-between gap-4">
        {/* 左侧：返回导航主页 */}
        <div className="flex items-center gap-1 p-1">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl transition-all bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* 中间：AI 搜索框 */}
        {activeManageType === 'note' ? (
        <div className="flex-1 max-w-xl relative">
          <div className="relative group">
            {/* 渐变边框效果 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full opacity-30 group-hover:opacity-60 group-focus-within:opacity-100 transition duration-300 blur-[1px]" />

            <div className="relative flex items-center bg-light-card dark:bg-dark-card rounded-full border border-transparent">
              {/* AI 图标 */}
              <div className="absolute left-3 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-500 dark:text-purple-400 animate-pulse" />
              </div>

              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  placeholder="用 AI 搜索你的笔记..."
                  className="w-full h-11 pl-10 pr-24 rounded-full bg-light-bg dark:bg-dark-bg
                       text-light-text dark:text-dark-text text-sm
                       placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70
                       focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />

              {/* 加载图标 */}
              {isSearching && (
                <div className="absolute right-14">
                  <Loader2 size={16} className="text-purple-500 animate-spin" />
                </div>
              )}

            </div>
          </div>

          {/* 搜索结果下拉框 */}
          {showSearchDropdown && searchResults.length > 0 && (
            <>
              {/* 遮罩层，用于点击外部关闭 */}
              <div
                className="fixed inset-0 z-10"
                onClick={handleClickOutside}
              />
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border z-20 overflow-hidden">
                <div className="py-2">
                  <div className="px-3 py-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    相似笔记
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result.noteId}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full px-3 py-2.5 text-left hover:bg-light-bg dark:hover:bg-dark-bg transition-colors border-b border-light-border dark:border-dark-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <FileText size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                            {result.noteTitle}
                          </div>
                          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 line-clamp-2">
                            {result.matchedChunk}
                          </div>
                          <div className="text-xs text-purple-500 mt-1">
                            相似度: {Math.round(result.similarity * 100)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        ) : (
        /* 文件管理模式：AI 搜索框 */
        <div className="flex-1 max-w-xl relative">
          <div className="relative group">
            {/* 渐变边框效果 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full opacity-30 group-hover:opacity-60 group-focus-within:opacity-100 transition duration-300 blur-[1px]" />

            <div className="relative flex items-center bg-light-card dark:bg-dark-card rounded-full border border-transparent">
              {/* AI 图标 */}
              <div className="absolute left-3 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-500 dark:text-purple-400 animate-pulse" />
              </div>

              <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={(e) => handleFileSearchInput(e.target.value)}
                  onFocus={() => fileSearchQuery && setShowFileSearchDropdown(true)}
                  placeholder="用 AI 搜索你的文件..."
                  className="w-full h-11 pl-10 pr-24 rounded-full bg-light-bg dark:bg-dark-bg
                       text-light-text dark:text-dark-text text-sm
                       placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70
                       focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />

              {/* 加载图标 */}
              {isFileSearching && (
                <div className="absolute right-14">
                  <Loader2 size={16} className="text-purple-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* 搜索结果下拉框 */}
          {showFileSearchDropdown && fileSearchResults.length > 0 && (
            <>
              {/* 遮罩层 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFileSearchDropdown(false)}
              />
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-dark-card rounded-xl shadow-lg border border-light-border dark:border-dark-border z-20 overflow-hidden">
                <div className="py-2">
                  <div className="px-3 py-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    相似文件
                  </div>
                  {fileSearchResults.map((result) => (
                    <button
                      key={result.fileId}
                      onClick={() => handleFileSearchResultClick(result)}
                      className="w-full px-3 py-2.5 text-left hover:bg-light-bg dark:hover:bg-dark-bg transition-colors border-b border-light-border dark:border-dark-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <Folder size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                            {result.fileName}
                          </div>
                          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 line-clamp-2">
                            {result.matchedChunk}
                          </div>
                          <div className="text-xs text-purple-500 mt-1">
                            相似度: {Math.round(result.similarity * 100)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <button
              onClick={handleToggleTheme}
              className="p-2 hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
          >
            {theme === 'light' ? (
                <Sun size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
            ) : (
                <Moon size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
            )}
          </button>
        </div>
      </header>

      {/* 修改密码弹窗 */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </>
  );
}

// 修改密码弹窗组件
interface ChangePasswordModalProps {
  onClose: () => void;
}

function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return;
    }
    if (newPassword === oldPassword) {
      setError('新密码不能与原密码相同');
      return;
    }

    setIsLoading(true);
    try {
      const params: ChangePasswordParams = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      };
      const response = await changePassword(params);
      if (response.code === 200) {
        setSuccess('密码修改成功！');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || '密码修改失败');
      }
    } catch (err: any) {
      setError(err.message || '密码修改失败，请检查原密码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">修改密码</h3>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">请验证原密码后设置新密码</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
          >
            <X size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 原密码 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-light-text dark:text-dark-text">原密码</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className="w-full h-11 pl-4 pr-12 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                     text-light-text dark:text-dark-text text-sm
                     focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-light-card dark:hover:bg-dark-card rounded-lg transition-colors"
              >
                {showOldPassword ? (
                  <EyeOff size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                ) : (
                  <Eye size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                )}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-light-text dark:text-dark-text">新密码</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="w-full h-11 pl-4 pr-12 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                     text-light-text dark:text-dark-text text-sm
                     focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-light-card dark:hover:bg-dark-card rounded-lg transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                ) : (
                  <Eye size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                )}
              </button>
            </div>
          </div>

          {/* 确认新密码 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-light-text dark:text-dark-text">确认新密码</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full h-11 pl-4 pr-12 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                     text-light-text dark:text-dark-text text-sm
                     focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-light-card dark:hover:bg-dark-card rounded-lg transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                ) : (
                  <Eye size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                )}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 px-4 rounded-xl border border-light-border dark:border-dark-border
                   text-light-text dark:text-dark-text text-sm font-medium
                   hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600
                   text-white text-sm font-medium
                   hover:from-violet-600 hover:to-purple-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                '确认修改'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// LeftSidebar 组件的 props 接口
interface LeftSidebarProps {
  onContextMenu: (directoryId: number, x: number, y: number) => void;
  onOpenTagModal: () => void;
  activeManageType: 'note' | 'file';
}

// 右键菜单组件 props
interface ContextMenuProps {
  directoryId: number | null;
  x: number;
  y: number;
  directories: Directory[];
  onCreateGroup: () => void;
  onCreateNotebook: () => void;
  onRenameGroup: (groupId: number, currentName: string) => void;
  onRenameNotebook: (notebookId: number, currentName: string) => void;
  onMoveToGroup: (notebookId: number) => void;
  onRemoveFromGroup: (notebookId: number) => void;
  onDelete: (directoryId: number) => void;
  onClose: () => void;
}

// 右键菜单组件
function ContextMenu({ directoryId, x, y, directories, onCreateGroup, onCreateNotebook, onRenameGroup, onRenameNotebook, onMoveToGroup, onRemoveFromGroup, onDelete, onClose }: ContextMenuProps) {
  // 查找当前目录
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

  // 统计笔记本总数（递归）
  const countNotebooks = (dirs: Directory[]): number => {
    let count = 0;
    for (const dir of dirs) {
      if (dir.type === 'note') count++;
      if (dir.children) {
        count += countNotebooks(dir.children);
      }
    }
    return count;
  };

  const totalNotebooks = countNotebooks(directories);

  const directory = directoryId ? findDirectory(directories, directoryId) : null;
  const isGroup = directory?.type === 'group';
  const isOnlyNotebook = directory?.type === 'note' && totalNotebooks === 1;

  // 检查组下是否有笔记本（递归检查）
  const hasNotebooks = (dir: Directory): boolean => {
    if (dir.type === 'note') return true;
    if (dir.children) {
      for (const child of dir.children) {
        if (hasNotebooks(child)) return true;
      }
    }
    return false;
  };

  const groupHasNotebooks = isGroup && directory ? hasNotebooks(directory) : false;

  return (
      <div
          className="fixed z-[9999] bg-white dark:bg-dark-card rounded-lg shadow-lg border border-light-border dark:border-dark-border py-1 min-w-[140px]"
          style={{ left: x + 8, top: y + 8 }}
          onClick={(e) => e.stopPropagation()}
      >
        {/* 组的操作 */}
        {isGroup ? (
            <>
              {/* 组下可以新增笔记本 */}
              <button
                  onClick={onCreateNotebook}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
              >
                <BookOpen size={16} />
                新建笔记本
              </button>
              {/* 重命名组 */}
              <button
                  onClick={() => {
                    if (directoryId && directory) {
                      onRenameGroup(directoryId, directory.name);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
              >
                <Edit2 size={16} />
                重命名组
              </button>
              {/* 删除 - 只有底下没有笔记的组才可以删除 */}
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (directoryId && !groupHasNotebooks) {
                      onDelete(directoryId);
                      onClose();
                    }
                  }}
                  disabled={groupHasNotebooks}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      groupHasNotebooks
                          ? 'text-light-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
                          : 'text-error hover:bg-light-bg dark:hover:bg-dark-card'
                  }`}
                  title={groupHasNotebooks ? '组内包含笔记本，无法删除' : '删除组'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                删除
              </button>
            </>
        ) : (
            /* 笔记本的操作 */
            <>
              {/* 重命名笔记本 */}
              <button
                  onClick={() => {
                    if (directoryId && directory) {
                      onRenameNotebook(directoryId, directory.name);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
              >
                <Edit2 size={16} />
                重命名笔记本
              </button>
              {/* 笔记本在组下时显示解除关联和移动到组，否则显示移动到组和新建组 */}
              {directory?.parentId ? (
                  <>
                    {/* 移动到组 */}
                    <button
                        onClick={() => {
                          if (directoryId) {
                            onMoveToGroup(directoryId);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                    >
                      <Folder size={16} />
                      移动到组
                    </button>
                    {/* 解除组关联 */}
                    <button
                        onClick={() => {
                          if (directoryId) {
                            onRemoveFromGroup(directoryId);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      解除组关联
                    </button>
                  </>
              ) : (
                  <>
                    {/* 新建组 - 将笔记本放入新组 */}
                    <button
                        onClick={onCreateGroup}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                    >
                      <Layers size={16} />
                      新建组
                    </button>
                    {/* 移动到组 */}
                    <button
                        onClick={() => {
                          if (directoryId) {
                            onMoveToGroup(directoryId);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
                    >
                      <Folder size={16} />
                      移动到组
                    </button>
                  </>
              )}
              {/* 删除笔记本 */}
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (directoryId) {
                      onDelete(directoryId);
                      onClose();
                    }
                  }}
                  disabled={isOnlyNotebook}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isOnlyNotebook
                          ? 'text-light-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
                          : 'text-error hover:bg-light-bg dark:hover:bg-dark-card'
                  }`}
                  title={isOnlyNotebook ? '至少保留一个笔记本' : '删除笔记本'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                删除
              </button>
            </>
        )}
      </div>
  );
}

// 左侧边栏组件
function LeftSidebar({ onContextMenu, onOpenTagModal, activeManageType }: LeftSidebarProps) {
  const user = useAppStore((state: AppState) => state.user);
  const tags = useAppStore((state: AppState) => state.tags);
  const directories = useAppStore((state: AppState) => state.directories);
  const currentNotebookId = useAppStore((state: AppState) => state.currentNotebookId);
  const selectedTagName = useAppStore((state: AppState) => state.selectedTagName);
  const selectNotebook = useAppStore((state: AppState) => state.selectNotebook);
  const selectTag = useAppStore((state: AppState) => state.selectTag);
  const loadDirectories = useAppStore((state: AppState) => state.loadDirectories);
  const addDirectory = useAppStore((state: AppState) => state.addDirectory);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState('');

  // 加载目录数据
  useEffect(() => {
    loadDirectories(activeManageType);
  }, [activeManageType, loadDirectories]);

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const toggleNotebookExpand = (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
    } else {
      newExpanded.add(notebookId);
    }
    setExpandedNotebooks(newExpanded);
  };

  // 处理新增目录（笔记本/文件夹）- 始终在根层级创建
  const handleAddDirectory = async () => {
    if (!newDirectoryName.trim()) return;

    const success = await addDirectory({
      name: newDirectoryName.trim(),
      type: activeManageType,
      parentId: null,  // 始终在根层级创建
      sortNum: 0,
    });

    if (success) {
      setNewDirectoryName('');
      setShowAddDialog(false);
    }
  };

  // 处理目录右键菜单
  const handleDirectoryContextMenu = (e: React.MouseEvent, directoryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(directoryId, e.clientX, e.clientY);
  };

  // 递归渲染目录树
  const renderDirectoryTree = (directory: Directory, level: number = 0) => {
    const isExpanded = expandedNotebooks.has(String(directory.id));
    const isSelected = currentNotebookId === String(directory.id);
    const hasChildren = directory.children && directory.children.length > 0;
    const isGroup = directory.type === 'group';

    return (
        <div key={directory.id}>
          <div
              onClick={async () => {
                await selectNotebook(String(directory.id), isGroup);
              }}
              onContextMenu={(e) => handleDirectoryContextMenu(e, directory.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group
                ${isSelected
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card'
                }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {/* 展开/折叠箭头 */}
            <span
                onClick={(e) => hasChildren && toggleNotebookExpand(String(directory.id), e)}
                className={`p-0.5 rounded hover:bg-light-bg dark:hover:bg-dark-card transition-colors ${!hasChildren ? 'invisible' : ''}`}
            >
              <ChevronRight
                size={14}
                className={`text-light-text-secondary dark:text-dark-text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </span>

            {/* 图标 - 根据类型显示不同图标 */}
            {isGroup ? (
                isSelected ? (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                    <Layers size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                    <Layers size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                )
            ) : (
                isSelected ? (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <BookOpen size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <BookOpen size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                )
            )}

            {/* 名称 - 选中时变色 */}
            <span className={`flex-1 text-left ${isSelected ? 'text-brand-500 font-medium' : ''}`}>
              {directory.name}
            </span>

            {/* 更多操作按钮 */}
            <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDirectoryContextMenu(e, directory.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-light-bg dark:hover:bg-dark-card transition-all cursor-pointer"
            >
            <MoreHorizontal size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
          </span>
          </div>

          {/* 渲染子目录 */}
          {isExpanded && hasChildren && (
              <div>
                {directory.children?.map((child: Directory) => renderDirectoryTree(child, level + 1))}
              </div>
          )}
        </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">

        {/* 目录列表 - 占据剩余空间，可滚动 */}
        <div className="px-4 py-2 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase">
            {activeManageType === 'note' ? '笔记本' : '文件夹'}
          </span>
            <button
                onClick={() => setShowAddDialog(true)}
                className="p-1 hover:bg-light-bg dark:hover:bg-dark-card rounded transition-colors"
                title="新建目录"
            >
              <Plus size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          </div>
          <nav className="space-y-1">
            {directories.length === 0 ? (
                <div className="text-center py-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  暂无目录
                </div>
            ) : (
                directories.filter((d: Directory) => !d.parentId).map((directory: Directory) => renderDirectoryTree(directory))
            )}
          </nav>
        </div>

        {/* 标签列表 - 固定在底部，占15%高度 */}
        <div className="px-4 py-2 border-t border-light-border dark:border-dark-border h-[15%] min-h-[80px] flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <TagIcon size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
              <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase">标签</span>
            </div>
            {/* 管理标签按钮 */}
            <button
                onClick={onOpenTagModal}
                className="p-1 hover:bg-light-bg dark:hover:bg-dark-card rounded transition-colors"
                title="管理标签"
            >
              <Plus size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 overflow-y-auto content-start">
            {tags.map((tag: Tag) => (
                <button
                    key={tag.id}
                    onClick={() => selectTag(tag.name)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium h-fit transition-all
                      ${selectedTagName === tag.name
                        ? 'ring-1 ring-offset-1'
                        : 'hover:opacity-80'
                      }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      ['--tw-ring-color' as string]: tag.color,
                    }}
                    title={`点击筛选包含"${tag.name}"标签的笔记`}
                >
                  {tag.name}
                  <span className="ml-1 text-light-text-secondary dark:text-dark-text-secondary">{tag.noteCount}</span>
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* 新增目录弹窗 */}
      {showAddDialog && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
              {/* 遮罩层 */}
              <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewDirectoryName('');
                  }}
              />

              {/* 弹窗内容 */}
              <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
                  新建{activeManageType === 'note' ? '笔记本' : '文件夹'}
                </h3>

                <input
                    type="text"
                    value={newDirectoryName}
                    onChange={(e) => setNewDirectoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDirectory();
                      }
                    }}
                    placeholder="请输入名称"
                    className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                />

                <div className="flex gap-3 mt-6 justify-end">
                  <button
                      onClick={() => {
                        setShowAddDialog(false);
                        setNewDirectoryName('');
                      }}
                      className="px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                      onClick={handleAddDirectory}
                      disabled={!newDirectoryName.trim()}
                      className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
        )}
    </>
  );
}

// 移动到组弹窗组件
function MoveToGroupModal({
                            notebookId,
                            directories,
                            onClose,
                            onConfirm,
                          }: {
  notebookId: number | null;
  directories: Directory[];
  onClose: () => void;
  onConfirm: (groupId: number | null) => Promise<void>;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // 递归查找所有组（排除当前笔记本所在的组）
  const findGroups = (dirs: Directory[]): Directory[] => {
    let groups: Directory[] = [];
    for (const dir of dirs) {
      if (dir.type === 'group') {
        groups.push(dir);
      }
      if (dir.children) {
        groups = groups.concat(findGroups(dir.children));
      }
    }
    return groups;
  };

  const groups = findGroups(directories);

  const handleMove = async () => {
    if (isMoving) return;
    setIsMoving(true);
    await onConfirm(selectedGroupId);
    setIsMoving(false);
  };

  return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
          <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
            移动到组
          </h3>

          {groups.length === 0 ? (
              <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                暂无可用的组
              </div>
          ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-sm
                  ${selectedGroupId === group.id
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-card'
                        }`}
                    >
                      <Layers size={18} className={selectedGroupId === group.id ? 'text-brand-500' : 'text-light-text-secondary dark:text-dark-text-secondary'} />
                      <span className="flex-1 text-left">{group.name}</span>
                      {selectedGroupId === group.id && <Check size={16} className="text-brand-500" />}
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
                disabled={isMoving}
                className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMoving ? '移动中...' : '确定'}
            </button>
          </div>
        </div>
      </div>
  );
}