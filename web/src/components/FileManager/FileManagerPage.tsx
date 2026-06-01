import { useState, useRef, useEffect } from 'react';
import { fetchFilePreview } from '@/api/file';
import { withApiPrefix } from '@/utils/apiPath';
import {
  FileText,
  MoreVertical,
  Upload,
  Grid,
  List,
  ChevronRight,
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  X
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  size?: number;
  modifiedTime: string;
  childCount?: number;  // 子目录/文件数量
}

// AI 搜索文件结果类型
interface AISearchResult {
  fileId: string;
  fileName: string;
  matchedChunk: string;
  similarity: number;
}

// 文件列表项类型（与后端对应）
interface FileListItem {
  id: number;
  name: string;
  isDirectory: boolean;
  type: string;
  extension?: string;
  size: number;
  url?: string;
  parentId?: number;
  level: number;
  sortNum: number;
  icon?: string;
  userId: number;
  createTime: string;
  updateTime: string;
  childCount?: number;  // 子目录/文件数量
}

// 获取文件列表
const fetchFileList = async (userId: number, parentId?: number) => {
  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(withApiPrefix('/file/list')!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-token': token },
      body: JSON.stringify({
        userId: userId,
        parentId: parentId || null,
        isDirectory: null
      }),
    });
    const result = await response.json();
    if (result.code === 200) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
};

// ── 文件类型图标配置（阿里云 OSS 风格）────────────────────────────────
interface FileIconConfig {
  label: string;
  bg: string;       // 背景色
  labelColor: string; // 文字色
  icon?: 'folder' | 'image' | 'video' | 'audio';
}

const FILE_ICON_MAP: Record<string, FileIconConfig> = {
  // 文件夹
  folder:   { label: '', bg: '', labelColor: '', icon: 'folder' },
  // Excel
  xlsx:     { label: 'XLS',  bg: '#1D6F42', labelColor: '#fff' },
  xls:      { label: 'XLS',  bg: '#1D6F42', labelColor: '#fff' },
  csv:      { label: 'CSV',  bg: '#1D6F42', labelColor: '#fff' },
  // Word
  docx:     { label: 'DOC',  bg: '#2B5597', labelColor: '#fff' },
  doc:      { label: 'DOC',  bg: '#2B5597', labelColor: '#fff' },
  // PPT
  pptx:     { label: 'PPT',  bg: '#C43E1C', labelColor: '#fff' },
  ppt:      { label: 'PPT',  bg: '#C43E1C', labelColor: '#fff' },
  // PDF
  pdf:      { label: 'PDF',  bg: '#E8201A', labelColor: '#fff' },
  // JSON
  json:     { label: 'JSON', bg: '#F0A500', labelColor: '#fff' },
  // Markdown
  md:       { label: 'MD',   bg: '#083FA1', labelColor: '#fff' },
  markdown: { label: 'MD',   bg: '#083FA1', labelColor: '#fff' },
  // 纯文本
  txt:      { label: 'TXT',  bg: '#7C8FA6', labelColor: '#fff' },
  log:      { label: 'LOG',  bg: '#7C8FA6', labelColor: '#fff' },
  // 代码 - JS/TS
  js:       { label: 'JS',   bg: '#F7DF1E', labelColor: '#333' },
  jsx:      { label: 'JSX',  bg: '#F7DF1E', labelColor: '#333' },
  ts:       { label: 'TS',   bg: '#3178C6', labelColor: '#fff' },
  tsx:      { label: 'TSX',  bg: '#3178C6', labelColor: '#fff' },
  // 代码 - 后端
  py:       { label: 'PY',   bg: '#3572A5', labelColor: '#fff' },
  java:     { label: 'JAVA', bg: '#B07219', labelColor: '#fff' },
  go:       { label: 'GO',   bg: '#00ACD7', labelColor: '#fff' },
  rs:       { label: 'RS',   bg: '#DEA584', labelColor: '#333' },
  php:      { label: 'PHP',  bg: '#4F5D95', labelColor: '#fff' },
  rb:       { label: 'RB',   bg: '#CC342D', labelColor: '#fff' },
  cpp:      { label: 'C++',  bg: '#00599C', labelColor: '#fff' },
  c:        { label: 'C',    bg: '#A8B9CC', labelColor: '#333' },
  cs:       { label: 'C#',   bg: '#178600', labelColor: '#fff' },
  // Web
  html:     { label: 'HTML', bg: '#E34F26', labelColor: '#fff' },
  htm:      { label: 'HTML', bg: '#E34F26', labelColor: '#fff' },
  css:      { label: 'CSS',  bg: '#264DE4', labelColor: '#fff' },
  scss:     { label: 'SCSS', bg: '#CD6799', labelColor: '#fff' },
  // 配置类
  yaml:     { label: 'YAML', bg: '#CB171E', labelColor: '#fff' },
  yml:      { label: 'YML',  bg: '#CB171E', labelColor: '#fff' },
  toml:     { label: 'TOML', bg: '#9C4221', labelColor: '#fff' },
  xml:      { label: 'XML',  bg: '#F16529', labelColor: '#fff' },
  env:      { label: 'ENV',  bg: '#ECD53F', labelColor: '#333' },
  // Shell
  sh:       { label: 'SH',   bg: '#4EAA25', labelColor: '#fff' },
  bash:     { label: 'SH',   bg: '#4EAA25', labelColor: '#fff' },
  zsh:      { label: 'SH',   bg: '#4EAA25', labelColor: '#fff' },
  // 压缩
  zip:      { label: 'ZIP',  bg: '#F5A623', labelColor: '#fff' },
  rar:      { label: 'RAR',  bg: '#F5A623', labelColor: '#fff' },
  '7z':     { label: '7Z',   bg: '#F5A623', labelColor: '#fff' },
  tar:      { label: 'TAR',  bg: '#F5A623', labelColor: '#fff' },
  gz:       { label: 'GZ',   bg: '#F5A623', labelColor: '#fff' },
  // 图片（专用图标）
  png:      { label: '', bg: '', labelColor: '', icon: 'image' },
  jpg:      { label: '', bg: '', labelColor: '', icon: 'image' },
  jpeg:     { label: '', bg: '', labelColor: '', icon: 'image' },
  gif:      { label: 'GIF',  bg: '#FF6F91', labelColor: '#fff' },
  svg:      { label: 'SVG',  bg: '#FFB400', labelColor: '#fff' },
  webp:     { label: 'IMG',  bg: '#9C59D1', labelColor: '#fff' },
  ico:      { label: 'ICO',  bg: '#9C59D1', labelColor: '#fff' },
  // 视频（专用图标）
  mp4:      { label: '', bg: '', labelColor: '', icon: 'video' },
  avi:      { label: '', bg: '', labelColor: '', icon: 'video' },
  mov:      { label: '', bg: '', labelColor: '', icon: 'video' },
  mkv:      { label: '', bg: '', labelColor: '', icon: 'video' },
  webm:     { label: '', bg: '', labelColor: '', icon: 'video' },
  // 音频（专用图标）
  mp3:      { label: '', bg: '', labelColor: '', icon: 'audio' },
  wav:      { label: '', bg: '', labelColor: '', icon: 'audio' },
  flac:     { label: '', bg: '', labelColor: '', icon: 'audio' },
  aac:      { label: '', bg: '', labelColor: '', icon: 'audio' },
  ogg:      { label: '', bg: '', labelColor: '', icon: 'audio' },
  // 可执行
  exe:      { label: 'EXE',  bg: '#607D8B', labelColor: '#fff' },
  dmg:      { label: 'DMG',  bg: '#607D8B', labelColor: '#fff' },
  apk:      { label: 'APK',  bg: '#3DDC84', labelColor: '#fff' },
  // 数据库
  sql:      { label: 'SQL',  bg: '#00758F', labelColor: '#fff' },
  db:       { label: 'DB',   bg: '#00758F', labelColor: '#fff' },
  // 字体
  ttf:      { label: 'FONT', bg: '#9E9E9E', labelColor: '#fff' },
  otf:      { label: 'FONT', bg: '#9E9E9E', labelColor: '#fff' },
  woff:     { label: 'FONT', bg: '#9E9E9E', labelColor: '#fff' },
};

// 从文件名提取扩展名
const getExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot !== -1 ? name.slice(dot + 1).toLowerCase() : '';
};

// 阿里云 OSS 风格的文件图标（SVG 内联实现）
const FileTypeIcon = ({ item, size = 20 }: { item: FileItem; size?: number }) => {
  // 文件夹
  if (item.type === 'folder') {
    return (
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <path d="M3 7C3 5.9 3.9 5 5 5h4l2 2h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7z"
          fill="#F59F00" stroke="#E08E00" strokeWidth="0.5" />
        <path d="M3 10h18v7c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-7z" fill="#FCC419" />
      </svg>
    );
  }

  const ext = getExtension(item.name);
  const config = FILE_ICON_MAP[ext];

  // 图片图标
  if (config?.icon === 'image') {
    return (
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#E8F5E9" stroke="#43A047" strokeWidth="1.2" />
        <circle cx="8" cy="9" r="2" fill="#81C784" />
        <path d="M2 16l5-5 4 4 3-3 5 4" stroke="#43A047" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }

  // 视频图标
  if (config?.icon === 'video') {
    return (
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#EDE7F6" stroke="#7E57C2" strokeWidth="1.2" />
        <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="#7E57C2" />
      </svg>
    );
  }

  // 音频图标
  if (config?.icon === 'audio') {
    return (
      <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#FCE4EC" stroke="#E91E63" strokeWidth="1.2" />
        <path d="M9 17V7l8-2v10" stroke="#E91E63" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7" cy="17" r="2" fill="#E91E63" />
        <circle cx="15" cy="15" r="2" fill="#E91E63" />
      </svg>
    );
  }

  // 带标签的文件图标（阿里云 OSS 样式：文件形状 + 彩色底部标签）
  const label = config?.label ?? ext.toUpperCase().slice(0, 4);
  const bg = config?.bg ?? '#78909C';
  const labelColor = config?.labelColor ?? '#fff';
  const displayLabel = label || ext.toUpperCase().slice(0, 4) || 'FILE';
  const fontSize = displayLabel.length >= 4 ? 4 : 5;

  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
      {/* 文件底部主体 */}
      <path
        d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
        fill="#F5F7FA" stroke="#D0D7DE" strokeWidth="1"
      />
      {/* 折角 */}
      <path d="M14 2v4h4" stroke="#D0D7DE" strokeWidth="1" fill="none" />
      {/* 彩色标签条（底部） */}
      <rect x="4" y="14" width="16" height="8" rx="0 0 2 2" fill={bg} />
      <rect x="4" y="20" width="16" height="2" rx="0 0 2 2" fill={bg} />
      {/* 标签文字 */}
      <text
        x="12" y="19.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={labelColor}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="'SF Pro Display','Arial',sans-serif"
        letterSpacing="0.3"
      >
        {displayLabel}
      </text>
    </svg>
  );
};

// 兼容旧调用（list视图/grid视图/预览头部统一使用 FileTypeIcon）
const getFileIcon = (item: FileItem, size = 20) => {
  return <FileTypeIcon item={item} size={size} />;
};

// 格式化文件大小
const formatSize = (bytes?: number) => {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<FileItem[]>([]);
  // 前进/后退导航历史
  const [pathHistory, setPathHistory] = useState<FileItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileItem, setSelectedFileItem] = useState<FileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null); // Excel 结构化数据
  const [activeSheet, setActiveSheet] = useState<number>(0); // 当前激活的 Sheet tab
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);

  // 新建目录弹窗状态
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // 重命名弹窗状态
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState('');
  // 文件上传input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI 搜索相关状态
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<AISearchResult[]>([]);
  const [isAISearching, setIsAISearching] = useState(false);

  // 当前用户ID（TODO: 从用户上下文获取）
  const currentUserId = 1;

  // 加载文件列表
  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      const parentId = currentPath.length > 0 ? parseInt(currentPath[currentPath.length - 1].id) : undefined;
      const fileList = await fetchFileList(currentUserId, parentId);

      // 转换为 FileItem 格式
      const mappedFiles: FileItem[] = fileList.map((file: any) => ({
        id: String(file.id),
        name: file.name,
        type: file.isDirectory ? 'folder' : 'file',
        fileType: file.type as any,
        size: file.size,
        modifiedTime: file.updateTime || file.createTime,
        childCount: file.childCount,
      }));
      setFiles(mappedFiles);
      setLoading(false);
    };

    loadFiles();
  }, [currentPath, currentUserId]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => setShowContextMenu(null);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);


  // AI 搜索防抖
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI 搜索处理（带防抖）
  const handleAISearchInput = (value: string) => {
    setSearchKeyword(value);

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setShowAISearch(false);
      setAiSearchResults([]);
      return;
    }

    // 设置新的定时器，300ms 后执行搜索
    searchTimeoutRef.current = setTimeout(() => {
      handleAISearch(value);
    }, 300);
  };

  // AI 搜索（实际调用后端接口）
  const handleAISearch = async (query: string) => {
    setIsAISearching(true);
    setShowAISearch(true);

    // 模拟 API 调用，后续替换为实际接口
    // const results = await vectorSearchFiles(query);
    const mockResults: AISearchResult[] = [
      { fileId: '1', fileName: '工作文档.docx', matchedChunk: '这是与搜索关键词相关的文件内容片段...', similarity: 0.95 },
      { fileId: '2', fileName: '项目计划.pdf', matchedChunk: '另一个相关的文件内容...', similarity: 0.87 },
    ];

    // 模拟延迟
    setTimeout(() => {
      setAiSearchResults(mockResults);
      setIsAISearching(false);
    }, 500);
  };

  // 点击 AI 搜索结果
  const handleAISearchResultClick = (result: AISearchResult) => {
    console.log('点击了文件搜索结果:', result);
    setShowAISearch(false);
    setSearchKeyword('');
    // TODO: 跳转到对应文件
  };

  // 获取当前显示的文件列表（始终使用 files 状态）
  const currentFiles = files;

  // 过滤文件
  const filteredFiles = searchKeyword
    ? currentFiles.filter(f => f.name.toLowerCase().includes(searchKeyword.toLowerCase()))
    : currentFiles;

  // 点击文件夹进入
  const handleFolderClick = (folder: FileItem) => {
    const newPath = [...currentPath, folder];
    setCurrentPath(newPath);

    // 添加到历史记录（清除前进的历史）
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setSelectedFile(null);
    setSelectedFileItem(null);
  };

  // 不可预览的二进制文件扩展名（黑名单），其余文件均允许查看详情
  const binaryExtensions = new Set([
    // 图片
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp', '.tiff', '.tif', '.psd', '.raw',
    // 视频
    '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v', '.3gp',
    // 音频
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus',
    // 压缩包
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.zst',
    // 可执行 / 二进制
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dmg', '.iso', '.msi', '.apk', '.ipa',
    // 办公文档（暂不支持预览）
    '.doc', '.docx', '.ppt', '.pptx', '.pdf',
    // 字体
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    // 数据库
    '.db', '.sqlite', '.mdb',
  ]);

  const isPreviewableFile = (file: FileItem): boolean => {
    if (file.type !== 'file') return false;
    const dotIndex = file.name.lastIndexOf('.');
    if (dotIndex === -1) return true; // 无扩展名的文件默认可预览
    const ext = file.name.toLowerCase().slice(dotIndex);
    return !binaryExtensions.has(ext);
  };

  // 加载文件预览内容
  const loadFilePreview = async (file: FileItem) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent('');
    setPreviewData(null);
    try {
      const res = await fetchFilePreview(file.id);
      if (res.code === 200 && res.data) {
        if (res.data.type === 'excel') {
          setPreviewData(res.data);   // Excel 结构化数据
        } else {
          setPreviewContent(res.data.content ?? '');
        }
      } else {
        setPreviewError(res.msg || '无法加载预览内容');
      }
    } catch (err: any) {
      setPreviewError(err?.message || '加载预览失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 点击文件/文件夹处理
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file.id);
    if (file.type === 'folder') {
      handleFolderClick(file);
    } else if (isPreviewableFile(file)) {
      setSelectedFileItem(file);
      loadFilePreview(file);
    } else {
      setSelectedFileItem(null);
    }
  };

  // 关闭预览
  const closePreview = () => {
    setSelectedFileItem(null);
    setPreviewContent('');
    setPreviewData(null);
    setPreviewError(null);
  };

  // 点击面包屑导航
  const handleBreadcrumbClick = (index: number) => {
    let newPath: FileItem[];
    if (index === -1) {
      newPath = [];
    } else {
      newPath = currentPath.slice(0, index + 1);
    }
    setCurrentPath(newPath);

    // 添加到历史记录
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setSelectedFile(null);
  };

  // 后退（返回上一级）
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFile(null);
    }
  };

  // 前进
  const handleGoForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFile(null);
    }
  };

  // 判断是否可以后退/前进
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < pathHistory.length - 1;

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setShowContextMenu(null);
  };

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', '1'); // TODO: 从用户上下文获取
    if (currentPath.length > 0) {
      const parentId = parseInt(currentPath[currentPath.length - 1].id);
      formData.append('parent_id', parentId.toString());
    }

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(withApiPrefix('/file/upload')!, {
        method: 'POST',
        headers: { 'x-token': token },
        body: formData,
      });
      const result = await response.json();
      if (result.code === 200) {
        console.log('文件上传成功:', result.data);
        // 刷新当前目录文件列表
        const loadFiles = async () => {
          setLoading(true);
          const parentId = currentPath.length > 0 ? parseInt(currentPath[currentPath.length - 1].id) : undefined;
          const fileList = await fetchFileList(currentUserId, parentId);
          const mappedFiles: FileItem[] = fileList.map((file: any) => ({
            id: String(file.id),
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
            fileType: file.type as any,
            size: file.size,
            modifiedTime: file.updateTime || file.createTime,
            childCount: file.childCount,
          }));
          setFiles(mappedFiles);
          setLoading(false);
        };
        loadFiles();
      } else {
        console.error('文件上传失败:', result.message);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
    }

    // 清空input，允许重复选择同一文件
    e.target.value = '';
  };

  // 新建目录
  const handleCreateDirectory = async () => {
    if (!newFolderName.trim()) return;

    const parentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : '';

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(withApiPrefix('/file/create/directory')!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-token': token
        },
        body: `name=${encodeURIComponent(newFolderName)}&user_id=1${parentId ? '&parent_id=' + parentId : ''}`,
      });
      const result = await response.json();
      if (result.code === 200) {
        setShowNewFolderModal(false);
        setNewFolderName('');
        console.log('目录创建成功');
        // 刷新文件列表
        const loadFiles = async () => {
          const pId = currentPath.length > 0 ? parseInt(currentPath[currentPath.length - 1].id) : undefined;
          const fileList = await fetchFileList(currentUserId, pId);
          const mappedFiles: FileItem[] = fileList.map((file: any) => ({
            id: String(file.id),
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
            fileType: file.type as any,
            size: file.size,
            modifiedTime: file.updateTime || file.createTime,
            childCount: file.childCount,
          }));
          setFiles(mappedFiles);
        };
        loadFiles();
      } else {
        console.error('目录创建失败:', result.message);
      }
    } catch (error) {
      console.error('目录创建失败:', error);
    }
  };

  // 删除文件/目录
  const handleDelete = async (fileId: string) => {
    if (!confirm('确定要删除这个文件/目录吗？')) return;

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(withApiPrefix(`/file/delete/${fileId}`)!, {
        method: 'DELETE',
        headers: { 'x-token': token },
      });
      const result = await response.json();
      if (result.code === 200) {
        console.log('删除成功');
        // 刷新文件列表
        const loadFiles = async () => {
          const parentId = currentPath.length > 0 ? parseInt(currentPath[currentPath.length - 1].id) : undefined;
          const fileList = await fetchFileList(currentUserId, parentId);
          const mappedFiles: FileItem[] = fileList.map((file: any) => ({
            id: String(file.id),
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
            fileType: file.type as any,
            size: file.size,
            modifiedTime: file.updateTime || file.createTime,
            childCount: file.childCount,
          }));
          setFiles(mappedFiles);
        };
        loadFiles();
      } else {
        alert(result.msg || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
    setShowContextMenu(null);
  };

  // 重命名文件/目录
  const handleRename = async () => {
    if (!renameFileId || !renameFileName.trim()) return;

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(withApiPrefix(`/file/rename/${renameFileId}`)!, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-token': token
        },
        body: `name=${encodeURIComponent(renameFileName.trim())}`,
      });
      const result = await response.json();
      if (result.code === 200) {
        console.log('重命名成功');
        setShowRenameModal(false);
        setRenameFileId(null);
        setRenameFileName('');
        // 刷新文件列表
        const loadFiles = async () => {
          const parentId = currentPath.length > 0 ? parseInt(currentPath[currentPath.length - 1].id) : undefined;
          const fileList = await fetchFileList(currentUserId, parentId);
          const mappedFiles: FileItem[] = fileList.map((file: any) => ({
            id: String(file.id),
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
            fileType: file.type as any,
            size: file.size,
            modifiedTime: file.updateTime || file.createTime,
            childCount: file.childCount,
          }));
          setFiles(mappedFiles);
        };
        loadFiles();
      } else {
        alert(result.msg || '重命名失败');
      }
    } catch (error) {
      console.error('重命名失败:', error);
      alert('重命名失败');
    }
    setShowContextMenu(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-light-bg dark:bg-dark-bg" onClick={closeContextMenu}>
      {/* 路径导航栏 - 独立一行 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
        {/* 前进/后退按钮组 */}
        <div className="flex items-center gap-1 pr-3 border-r border-light-border dark:border-dark-border">
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            className={`p-1.5 rounded transition-colors ${
              canGoBack
                ? 'hover:bg-light-bg dark:hover:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary cursor-not-allowed'
            }`}
            title="后退"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            className={`p-1.5 rounded transition-colors ${
              canGoForward
                ? 'hover:bg-light-bg dark:hover:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary cursor-not-allowed'
            }`}
            title="前进"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* 路径导航：类似Windows/OSS的盘符导航 */}
        <div className="flex items-center gap-1 text-sm">
          {/* 根目录/盘符 */}
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            title="根目录"
          >
            <HardDrive size={16} className="text-blue-500" />
            <span className="font-medium text-light-text dark:text-dark-text">我的文件</span>
          </button>

          {/* 当前路径 */}
          {currentPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight size={14} className="text-light-text-tertiary dark:text-dark-text-tertiary mx-0.5" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="px-1.5 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-light-text dark:text-dark-text max-w-[120px] truncate"
                title={folder.name}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 主体内容区 - 左右分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 - 文件列表（1/3宽度） */}
        <div className="w-1/3 flex flex-col border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
          {/* 工具栏 - 搜索和操作按钮 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
            {/* 左侧：搜索框 */}
            <div className="relative flex-1 max-w-xs mr-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索文件..."
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-light-bg dark:bg-dark-bg text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-2">

              {/* 隐藏的文件上传input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />

              {/* 上传按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 h-8 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
              >
                <Upload size={16} />
                <span>上传</span>
              </button>

              {/* 新建目录 */}
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-2 px-3 h-8 border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg text-sm rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>新建</span>
              </button>

              {/* 视图切换 */}
              <div className="flex items-center border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'hover:bg-light-bg dark:hover:bg-dark-bg'}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'hover:bg-light-bg dark:hover:bg-dark-bg'}`}
                >
                  <Grid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 文件列表 */}
          <div className="flex-1 overflow-auto p-4">
            {filteredFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
                <svg width={50} height={50} viewBox="0 0 24 24" fill="none" className="mb-4 opacity-40">
                  <path d="M3 7C3 5.9 3.9 5 5 5h4l2 2h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7z"
                    fill="#F59F00" stroke="#E08E00" strokeWidth="0.5" />
                  <path d="M3 10h18v7c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-7z" fill="#FCC419" />
                </svg>
                <p className="text-sm">文件夹为空</p>
              </div>
            ) : viewMode === 'list' ? (
              // 列表视图
              <div className="space-y-1">
                {/* 表头 */}
                <div className="flex items-center px-4 py-2 text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary border-b border-light-border dark:border-dark-border">
                  <div className="w-8"></div>
                  <div className="flex-1 min-w-0">名称</div>
                  <div className="w-20 text-right">大小</div>
                  <div className="w-8"></div>
                </div>

                {/* 文件列表 */}
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFile === file.id
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-light-bg dark:hover:bg-dark-bg'
                    }`}
                  >
                    <div className="w-8 flex-shrink-0">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm text-light-text dark:text-dark-text truncate">
                        {file.name}
                        {file.type === 'folder' && file.childCount !== undefined && (
                          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary ml-1">
                            ({file.childCount})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-20 text-right text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {formatSize(file.size)}
                    </div>
                    <div className="w-16 flex items-center justify-end gap-1">
                      {/* 下载按钮 - 仅文件显示，文件夹不显示 */}
                      {file.type === 'file' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('token') || '';
                              const response = await fetch(withApiPrefix(`/file/download/${file.id}`)!, {
                                method: 'GET',
                                headers: { 'x-token': token },
                              });
                              if (!response.ok) {
                                const error = await response.json();
                                alert(error.msg || '下载失败');
                                return;
                              }
                              // 将响应转换为 blob
                              const blob = await response.blob();
                              // 创建下载链接
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.name;
                              document.body.appendChild(a);
                              a.click();
                              // 清理
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('下载失败:', error);
                              alert('下载失败');
                            }
                          }}
                          className="p-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                          title="下载"
                        >
                          <Download size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, file.id);
                        }}
                        className="p-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                      >
                        <MoreVertical size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 网格视图
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                    className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFile === file.id
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-light-bg dark:hover:bg-dark-bg'
                    }`}
                  >
                    <div className="mb-2">
                      {getFileIcon(file, 36)}
                    </div>
                    <span className="text-sm text-light-text dark:text-dark-text text-center truncate w-full">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {/* 下载按钮 - 仅文件显示 */}
                      {file.type === 'file' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('token') || '';
                              const response = await fetch(withApiPrefix(`/file/download/${file.id}`)!, {
                                method: 'GET',
                                headers: { 'x-token': token },
                              });
                              if (!response.ok) {
                                const error = await response.json();
                                alert(error.msg || '下载失败');
                                return;
                              }
                              // 将响应转换为 blob
                              const blob = await response.blob();
                              // 创建下载链接
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.name;
                              document.body.appendChild(a);
                              a.click();
                              // 清理
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('下载失败:', error);
                              alert('下载失败');
                            }
                          }}
                          className="p-1 rounded hover:bg-light-card dark:hover:bg-dark-card transition-colors"
                          title="下载"
                        >
                          <Download size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧面板 - 文件预览（2/3宽度） */}
        <div className="w-2/3 flex flex-col bg-light-bg dark:bg-dark-bg">
          {selectedFileItem ? (
            <>
              {/* 预览头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFileItem)}
                  <span className="font-medium text-light-text dark:text-dark-text">{selectedFileItem.name}</span>
                </div>
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                >
                  <X size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
                </button>
              </div>

              {/* 预览内容 */}
              <div className="flex-1 overflow-auto p-4">
                {previewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={32} className="animate-spin text-brand-500" />
                    <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary">加载中...</span>
                  </div>
                ) : previewError ? (
                  <div className="flex flex-col items-center justify-center h-full text-light-text-secondary dark:text-dark-text-secondary">
                    <FileText size={48} className="mb-3 opacity-40" />
                    <p className="text-sm">{previewError}</p>
                  </div>
                ) : previewData?.type === 'excel' ? (
                  // Excel 表格预览
                  <div className="h-full flex flex-col">
                    {/* Sheet 切换 tab */}
                    {previewData.sheets.length > 1 && (
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {previewData.sheets.map((sheet: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSheet(idx)}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                              activeSheet === idx
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg'
                            }`}
                          >
                            {sheet.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* 表格 */}
                    {(() => {
                      const sheet = previewData.sheets[activeSheet] ?? previewData.sheets[0];
                      if (!sheet || !sheet.rows?.length) return <p className="text-sm text-light-text-secondary">(空表)</p>;
                      const [header, ...dataRows] = sheet.rows;
                      return (
                        <div className="flex-1 overflow-auto rounded-lg border border-light-border dark:border-dark-border">
                          {sheet.truncated && (
                            <div className="px-3 py-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-b border-light-border dark:border-dark-border">
                              ⚠️ 共 {sheet.total} 行，仅显示前 500 行
                            </div>
                          )}
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="sticky top-0 bg-light-card dark:bg-dark-card">
                                {header.map((cell: string, ci: number) => (
                                  <th
                                    key={ci}
                                    className="px-3 py-2 text-left font-semibold text-light-text dark:text-dark-text border-b border-r border-light-border dark:border-dark-border whitespace-nowrap"
                                  >
                                    {cell || ''}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataRows.map((row: string[], ri: number) => (
                                <tr
                                  key={ri}
                                  className={ri % 2 === 0 ? 'bg-transparent' : 'bg-light-bg/50 dark:bg-dark-bg/50'}
                                >
                                  {row.map((cell: string, ci: number) => (
                                    <td
                                      key={ci}
                                      className="px-3 py-1.5 text-light-text dark:text-dark-text border-b border-r border-light-border dark:border-dark-border whitespace-nowrap"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <pre className="text-sm text-light-text dark:text-dark-text font-mono whitespace-pre-wrap break-all bg-light-card dark:bg-dark-card p-4 rounded-lg">
                    {previewContent}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
              <FileText size={64} className="mb-4 opacity-30" />
              <p className="text-lg">选择文件查看详情</p>
              <p className="text-sm mt-2">支持预览所有文本类文件</p>
            </div>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {showContextMenu && (() => {
        const currentFile = files.find(f => f.id === showContextMenu.fileId);

        return (
          <div
            className="fixed bg-white dark:bg-dark-card rounded-lg shadow-lg border border-light-border dark:border-dark-border py-1 z-50"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (currentFile) {
                  setRenameFileId(currentFile.id);
                  setRenameFileName(currentFile.name);
                  setShowRenameModal(true);
                }
                setShowContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            >
              <Edit2 size={16} />
              <span>重命名</span>
            </button>
            <div className="my-1 border-t border-light-border dark:border-dark-border"></div>
            <button
              onClick={() => {
                if (showContextMenu) {
                  const id = showContextMenu.fileId;
                  setShowContextMenu(null);
                  setTimeout(() => handleDelete(id), 10);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            >
              <Trash2 size={16} />
              <span>删除</span>
            </button>
          </div>
        );
      })()}

      {/* 新建目录弹窗 */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewFolderModal(false)}>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">新建目录</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="请输入目录名称"
              className="w-full h-10 px-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/30 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDirectory()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 h-8 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateDirectory}
                className="px-4 h-8 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRenameModal(false)}>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">重命名</h3>
            <input
              type="text"
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              placeholder="请输入新名称"
              className="w-full h-10 px-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/30 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameFileId(null);
                  setRenameFileName('');
                }}
                className="px-4 h-8 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRename}
                className="px-4 h-8 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
