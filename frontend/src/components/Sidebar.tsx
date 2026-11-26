import React from 'react';
import {
  Plus,
  MessageSquare,
  Star,
  Settings,
  Info,
  Trash2,
  X,
  Database,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { ChatItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  chatHistory: ChatItem[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAllHistory: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  chatHistory,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAllHistory,
  onOpenSettings,
  onOpenAbout,
}) => {
  const starredQueries = chatHistory.filter((item) => item.isStarred);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#F7F7F8] dark:bg-[#1E1F20] border-r border-[#E5E7EB] dark:border-[#2D2E30] transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isDesktopCollapsed ? 'md:w-16' : 'md:w-68'
        } w-72 h-full`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#E5E7EB] dark:border-[#2D2E30]">
          {!isDesktopCollapsed ? (
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onNewChat}>
              <div className="w-7 h-7 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] flex items-center justify-center text-white dark:text-[#131314]">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-tight text-[#202123] dark:text-[#E3E3E3]">
                  TextSQL-GPT
                </span>
                <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                  Model v1
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto cursor-pointer" onClick={onNewChat}>
              <div className="w-8 h-8 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] flex items-center justify-center text-white dark:text-[#131314]">
                <Database className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#202123] dark:hover:text-[#E3E3E3] md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleDesktopCollapse}
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1 rounded-md text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2E30] transition-colors"
          >
            {isDesktopCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#131314] text-[#202123] dark:text-[#E3E3E3] text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#202123] transition-all shadow-2xs ${
              isDesktopCollapsed ? 'justify-center px-0' : ''
            }`}
            title="New Chat"
          >
            <Plus className="w-4 h-4 text-[#202123] dark:text-[#E3E3E3]" />
            {!isDesktopCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Middle Scrollable Section */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {/* Starred Queries */}
          {!isDesktopCollapsed && starredQueries.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Saved Queries</span>
              </div>
              <div className="space-y-1 mt-1">
                {starredQueries.map((item) => (
                  <div
                    key={`star-${item.id}`}
                    onClick={() => {
                      onSelectChat(item.id);
                      onClose();
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      currentChatId === item.id
                        ? 'bg-[#E5E7EB] dark:bg-[#2D2E30] text-[#202123] dark:text-[#E3E3E3] font-medium'
                        : 'text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#EBEBEF] dark:hover:bg-[#262729]'
                    }`}
                  >
                    <span className="truncate">{item.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat History */}
          {!isDesktopCollapsed ? (
            <div>
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Recent History</span>
                </span>
                {chatHistory.length > 0 && (
                  <button
                    onClick={onClearAllHistory}
                    title="Clear history"
                    className="text-[10px] text-[#9CA3AF] hover:text-rose-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {chatHistory.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-[#9CA3AF] dark:text-[#6B7280]">
                  No queries yet. Ask a question to begin.
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  {chatHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectChat(item.id);
                        onClose();
                      }}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        currentChatId === item.id
                          ? 'bg-[#E5E7EB] dark:bg-[#2D2E30] text-[#202123] dark:text-[#E3E3E3] font-medium'
                          : 'text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#EBEBEF] dark:hover:bg-[#262729]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                        <span className="truncate">{item.question}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-opacity"
                        title="Delete query"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Icon-only mode when collapsed */
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={onToggleDesktopCollapse}
                title="Expand History"
                className="p-2 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2E30]"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#E5E7EB] dark:border-[#2D2E30] space-y-1">
          {/* Settings */}
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#EBEBEF] dark:hover:bg-[#262729] hover:text-[#202123] dark:hover:text-[#E3E3E3] transition-colors ${
              isDesktopCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            {!isDesktopCollapsed && <span>Settings</span>}
          </button>

          {/* About Model */}
          <button
            onClick={() => {
              onOpenAbout();
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#EBEBEF] dark:hover:bg-[#262729] hover:text-[#202123] dark:hover:text-[#E3E3E3] transition-colors ${
              isDesktopCollapsed ? 'justify-center px-0' : ''
            }`}
            title="About Model"
          >
            <Info className="w-4 h-4" />
            {!isDesktopCollapsed && <span>About Model</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
