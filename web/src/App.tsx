import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore, type AppState } from '@/stores/useAppStore';
import LoginPage from './pages/LoginPage';
import NotePage from './pages/NotePage';
import FilePage from './pages/FilePage';
import NavigationPage from './pages/NavigationPage';
import MenuManagerPage from './pages/MenuManagerPage';
import WebsiteManagerPage from './components/WebsiteManager/WebsiteManagerPage';
import GalleryManagerPage from './components/GalleryManager/GalleryManagerPage';
import MusicManagerPage from './components/MusicManager/MusicManagerPage';
import AccountManagerPage from './components/AccountManager/AccountManagerPage';
import PlanManagerPage from './components/PlanManager/PlanManagerPage';
import BillingManagerPage from './components/BillingManager/BillingManagerPage';
import PromptManagerPage from './components/PromptManager/PromptManagerPage';
import NovelManagerPage from './components/NovelManager/NovelManagerPage';
import NovelDetailPage from './components/NovelManager/NovelDetailPage';
import ScriptManagerPage from './components/ScriptManager/ScriptManagerPage';
import CodeManagerPage from './components/CodeManager/CodeManagerPage';
import EnglishManagerPage from './components/EnglishManager/EnglishManagerPage';
import DockerManagerPage from './components/DockerManager/DockerManagerPage';
import CommandManagerPage from './components/CommandManager/CommandManagerPage';
import DraftManagerPage from './components/DraftManager/DraftManagerPage';
import MaterialManagerPage from './components/MaterialManager/MaterialManagerPage';
import MarkdownManagerPage from './components/MarkdownManager/MarkdownManagerPage';
import SoftwareManagerPage from './components/SoftwareManager/SoftwareManagerPage';
import JsonManagerPage from './components/JsonManager/JsonManagerPage';
import DeployManagerPage from './components/DeployManager/DeployManagerPage';
import ReleaseManagerPage from './components/ReleaseManager/ReleaseManagerPage';
import ProgressManagerPage from './components/ProgressManager/ProgressManagerPage';
import { Toaster } from 'react-hot-toast';

import ChangelogManagerPage from './components/ChangelogManager/ChangelogManagerPage';
import GuidelineManagerPage from './components/GuidelineManager/GuidelineManagerPage';
import ScreenshotManagerPage from './components/ScreenshotManager/ScreenshotManagerPage';
import LearningManagerPage from './components/LearningManager/LearningManagerPage';
import SkillManagerPage from './components/SkillManager/SkillManagerPage';
import AIMistakeManagerPage from './components/AIMistakeManager/AIMistakeManagerPage';
import ErrorManagerPage from './components/ErrorManager/ErrorManagerPage';
import ProductIdeaPage from './components/ProductIdea/ProductIdeaPage';
import PathManagerPage from './components/PathManager/PathManagerPage';
import PortManagerPage from './components/PortManager/PortManagerPage';

function App() {
  const isAuthenticated = useAppStore((state: AppState) => state.isAuthenticated);
  const theme = useAppStore((state: AppState) => state.theme);
  const initAuth = useAppStore((state: AppState) => state.initAuth);

  const isInitializing = useAppStore((state: AppState) => state.isInitializing);

  // 初始化认证状态
  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (isInitializing) {
    return <div className="h-screen w-screen bg-[#090A0F] flex items-center justify-center text-slate-500">加载中...</div>;
  }

  // 如果未认证统一重定向到登录页的封装组件
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }} 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={<ProtectedRoute><NavigationPage /></ProtectedRoute>} />
          <Route path="/menu-manager" element={<ProtectedRoute><MenuManagerPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><FilePage /></ProtectedRoute>} />
          <Route path="/websites" element={<ProtectedRoute><WebsiteManagerPage /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AccountManagerPage /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><GalleryManagerPage /></ProtectedRoute>} />
          <Route path="/music" element={<ProtectedRoute><MusicManagerPage /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><PlanManagerPage /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><BillingManagerPage /></ProtectedRoute>} />
          <Route path="/prompts" element={<ProtectedRoute><PromptManagerPage /></ProtectedRoute>} />
          <Route path="/novels" element={<ProtectedRoute><NovelManagerPage /></ProtectedRoute>} />
          <Route path="/novels/:novelId" element={<ProtectedRoute><NovelDetailPage /></ProtectedRoute>} />
          <Route path="/scripts" element={<ProtectedRoute><ScriptManagerPage /></ProtectedRoute>} />
          <Route path="/codes" element={<ProtectedRoute><CodeManagerPage /></ProtectedRoute>} />
          <Route path="/english" element={<ProtectedRoute><EnglishManagerPage /></ProtectedRoute>} />
          <Route path="/docker" element={<ProtectedRoute><DockerManagerPage /></ProtectedRoute>} />
          <Route path="/commands" element={<ProtectedRoute><CommandManagerPage /></ProtectedRoute>} />
          <Route path="/drafts" element={<ProtectedRoute><DraftManagerPage /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><MaterialManagerPage /></ProtectedRoute>} />
          <Route path="/markdowns" element={<ProtectedRoute><MarkdownManagerPage /></ProtectedRoute>} />
          <Route path="/software" element={<ProtectedRoute><SoftwareManagerPage /></ProtectedRoute>} />
          <Route path="/json" element={<ProtectedRoute><JsonManagerPage /></ProtectedRoute>} />
          <Route path="/deploy" element={<ProtectedRoute><DeployManagerPage /></ProtectedRoute>} />
          <Route path="/release" element={<ProtectedRoute><ReleaseManagerPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressManagerPage /></ProtectedRoute>} />

          <Route path="/changelog" element={<ProtectedRoute><ChangelogManagerPage /></ProtectedRoute>} />
          <Route path="/guidelines" element={<ProtectedRoute><GuidelineManagerPage /></ProtectedRoute>} />
          <Route path="/screenshots" element={<ProtectedRoute><ScreenshotManagerPage /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningManagerPage /></ProtectedRoute>} />
          <Route path="/skills" element={<ProtectedRoute><SkillManagerPage /></ProtectedRoute>} />
          <Route path="/ai-mistakes" element={<ProtectedRoute><AIMistakeManagerPage /></ProtectedRoute>} />
          <Route path="/errors" element={<ProtectedRoute><ErrorManagerPage /></ProtectedRoute>} />
          <Route path="/product-ideas" element={<ProtectedRoute><ProductIdeaPage /></ProtectedRoute>} />
          <Route path="/paths" element={<ProtectedRoute><PathManagerPage /></ProtectedRoute>} />
          <Route path="/ports" element={<ProtectedRoute><PortManagerPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
