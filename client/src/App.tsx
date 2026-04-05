import { useState, useCallback } from 'react';
import { ChevronRight, Search, Settings as SettingsIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import type { ViewType, DocumentResponse } from './types';
import { uploadDocument, getSettings } from './services/api';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import DocumentsView from './components/DocumentsView';
import SettingsView from './components/SettingsView';
import UploadModal from './components/UploadModal';
import DeleteModal from './components/DeleteModal';

const VIEW_TITLES: Record<ViewType, string> = {
  chat: 'Oil Market Assistant',
  documents: 'Document Management',
  settings: 'System Settings',
};

export default function App() {
  const [view, setView] = useState<ViewType>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newDocument, setNewDocument] = useState<DocumentResponse | null>(null);

  const handleUpload = useCallback(async (file: File, sourceType: 'EIA' | 'OPEC' | 'Other') => {
    let apiKey = '';
    try {
      const settings = await getSettings();
      apiKey = settings.api_key;
    } catch {
      // continue without key — backend will handle
    }
    const doc = await uploadDocument(file, sourceType, apiKey);
    setNewDocument(doc);
    setIsUploadModalOpen(false);
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setPendingDeleteId(deleteConfirmId);
    setDeleteConfirmId(null);
  }, [deleteConfirmId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleNewDocumentConsumed = useCallback(() => {
    setNewDocument(null);
  }, []);

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      <Sidebar
        view={view}
        setView={setView}
        onUploadClick={() => setIsUploadModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-bottom border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Workspace</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-sm font-medium">{VIEW_TITLES[view]}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('settings')}
              className={`p-2 transition-colors ${view === 'settings' ? 'text-brand-accent' : 'text-gray-400 hover:text-brand-primary'}`}
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {view === 'chat' && <ChatView key="chat" />}
            {view === 'documents' && (
              <DocumentsView
                key="documents"
                onDeleteRequest={handleDeleteRequest}
                pendingDeleteId={pendingDeleteId}
                onDeleteConfirmed={handleDeleteConfirmed}
                newDocument={newDocument}
                onNewDocumentConsumed={handleNewDocumentConsumed}
              />
            )}
{view === 'settings' && <SettingsView key="settings" />}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {deleteConfirmId && (
          <DeleteModal
            key="delete-modal"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadModal
            key="upload-modal"
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
