import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import MainLayout from '../components/layout/MainLayout';
import EditorArea from '../components/editor/EditorArea';
import NoteList from '../components/NoteManager/NoteList';
import type { AppState } from '@/stores/useAppStore';

export default function NotePage() {
  const location = useLocation();
  const isAuthenticated = useAppStore((state: AppState) => state.isAuthenticated);
  const loadNotes = useAppStore((state: AppState) => state.loadNotes);
  const fetchNoteById = useAppStore((state: AppState) => state.fetchNoteById);
  const selectNotebook = useAppStore((state: AppState) => state.selectNotebook);

  useEffect(() => {
    // 首页加载：如果是通过 AI 搜索带来的 state.noteId，则优先跳到该笔记
    const initNotes = async () => {
      if (!isAuthenticated) return;
      
      const { noteId, notebookId } = location.state || {};
      
      if (noteId) {
        if (notebookId) {
          await selectNotebook(String(notebookId), false, String(noteId));
        } else {
          const fullNote = await fetchNoteById(String(noteId));
          if (fullNote) {
            useAppStore.setState({
              currentNoteId: String(noteId),
              editingNote: { ...fullNote },
            });
          }
        }
      } else {
        const loadedNotes = await loadNotes();
        if (loadedNotes && loadedNotes.length > 0) {
          const firstNote = loadedNotes[0];
          const fullNote = await fetchNoteById(String(firstNote.id));
          if (fullNote) {
            useAppStore.setState({
              currentNoteId: String(firstNote.id),
              editingNote: { ...fullNote },
            });
          }
        }
      }
    };
    initNotes();
  }, [isAuthenticated, location.state]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout activeManageType="note">
      <NoteList />
      <EditorArea />
    </MainLayout>
  );
}
