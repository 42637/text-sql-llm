import React from 'react';
import { Menu, Moon, Sun, Database, Plus } from 'lucide-react';
import { ModelStatus } from './ModelStatus';
import type { ModelHealth } from '../types';

interface HeaderProps {
  health: ModelHealth | null;
  loading: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewChat: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  loading,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  onNewChat,
  onOpenAbout,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-[#E5E7EB] dark:border-[#2D2E30] bg-white/90 dark:bg-[#131314]/90 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="p-2 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#202123] hover:text-[#202123] dark:hover:text-[#E3E3E3] transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNewChat}>
          <div className="w-8 h-8 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] flex items-center justify-center text-white dark:text-[#131314] shadow-sm">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#202123] dark:text-[#E3E3E3]">
                TextSQL-GPT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E5E7EB] dark:bg-[#2D2E30] text-[#4B5563] dark:text-[#9CA3AF]">
                v1
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model status pill */}
        <ModelStatus health={health} loading={loading} onOpenAbout={onOpenAbout} />

        {/* New Chat quick button on desktop */}
        <button
          onClick={onNewChat}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] text-xs font-medium text-[#202123] dark:text-[#E3E3E3] hover:bg-[#F7F7F8] dark:hover:bg-[#1F2937] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#202123] hover:text-[#202123] dark:hover:text-[#E3E3E3] transition-colors focus:outline-none"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
