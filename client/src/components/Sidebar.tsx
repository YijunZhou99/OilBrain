import { MessageSquare, FileText, Settings as SettingsIcon, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { ViewType } from '../types';

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onUploadClick: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS: { id: ViewType; label: string; Icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { id: 'chat', label: 'Assistant', Icon: MessageSquare },
  { id: 'documents', label: 'Knowledge Base', Icon: FileText },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Sidebar({ view, setView, onUploadClick, isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="bg-white border-r border-gray-200 flex flex-col relative"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-primary shadow-sm z-20"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 ${isCollapsed ? 'px-4 flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-2 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold">
            OB
          </div>
          {!isCollapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap"
            >
              OilBrain
            </motion.h1>
          )}
        </div>

        <nav className="space-y-1 w-full">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${view === id ? 'bg-gray-100 text-brand-primary' : 'text-gray-500 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? label : ''}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium overflow-hidden whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className={`mt-auto p-6 border-t border-gray-100 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
        <button
          onClick={onUploadClick}
          className={`flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm ${isCollapsed ? 'w-10 h-10 p-0 rounded-full' : 'w-full'}`}
          title={isCollapsed ? 'Upload Report' : ''}
        >
          <Plus size={16} className="flex-shrink-0" />
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">Upload Report</span>}
        </button>
      </div>
    </motion.aside>
  );
}
