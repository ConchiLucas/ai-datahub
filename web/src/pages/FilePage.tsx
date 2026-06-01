import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import MainLayout from '../components/layout/MainLayout';
import FileManagerPage from '../components/FileManager/FileManagerPage';
import type { AppState } from '@/stores/useAppStore';

export default function FilePage() {
  const isAuthenticated = useAppStore((state: AppState) => state.isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout activeManageType="file">
      <FileManagerPage />
    </MainLayout>
  );
}
