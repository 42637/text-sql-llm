import React from 'react';
import { X, Moon, Sun, Sliders, Shield } from 'lucide-react';
import type { UserSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClearHistory: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#2D2E30]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#202123] dark:text-[#E3E3E3]" />
            <h3 className="text-sm font-semibold text-[#202123] dark:text-[#E3E3E3]">
              Application Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Theme Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#202123] dark:text-[#E3E3E3]">Color Theme</div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Switch between Light (default) and Dark theme
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#2D2E30] text-[#202123] dark:text-[#E3E3E3] font-medium"
            >
              {settings.darkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          <hr className="border-[#E5E7EB] dark:border-[#2D2E30]" />

          {/* Max Generation Tokens */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-medium text-[#202123] dark:text-[#E3E3E3]">
              <span>Max New Tokens</span>
              <span className="font-mono">{settings.maxTokens}</span>
            </div>
            <input
              type="range"
              min={64}
              max={512}
              step={32}
              value={settings.maxTokens}
              onChange={(e) => onUpdateSettings({ maxTokens: Number(e.target.value) })}
              className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#374151] rounded-lg appearance-none cursor-pointer accent-[#202123] dark:accent-[#E3E3E3]"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF]">
              <span>64</span>
              <span>256 (Default)</span>
              <span>512</span>
            </div>
          </div>

          {/* Sampling Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-medium text-[#202123] dark:text-[#E3E3E3]">
              <span>Temperature (Greedy = 0.0)</span>
              <span className="font-mono">{settings.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.5}
              step={0.05}
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: Number(e.target.value) })}
              className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#374151] rounded-lg appearance-none cursor-pointer accent-[#202123] dark:accent-[#E3E3E3]"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF]">
              <span>0.0 (Recommended • Maximum Accuracy)</span>
              <span>0.5</span>
            </div>
          </div>

          <hr className="border-[#E5E7EB] dark:border-[#2D2E30]" />

          {/* Safe Sandbox Execution Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#202123] dark:text-[#E3E3E3] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe Sandbox Preview</span>
              </div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Allow testing queries in ephemeral in-memory SQLite
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSandbox}
              onChange={(e) => onUpdateSettings({ enableSandbox: e.target.checked })}
              className="w-4 h-4 rounded text-[#202123] focus:ring-0 cursor-pointer accent-[#202123] dark:accent-[#E3E3E3]"
            />
          </div>

          <hr className="border-[#E5E7EB] dark:border-[#2D2E30]" />

          {/* Clear Local Data */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-rose-600 dark:text-rose-400">Clear Chat History</div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Removes all stored queries from this browser
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your query history?')) {
                  onClearHistory();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#2D2E30] bg-[#F9FAFB] dark:bg-[#18191A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] text-white dark:text-[#131314] font-medium text-xs hover:bg-black dark:hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
