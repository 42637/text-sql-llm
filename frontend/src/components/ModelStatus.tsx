import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ModelHealth } from '../types';

interface ModelStatusProps {
  health: ModelHealth | null;
  loading: boolean;
  onOpenAbout?: () => void;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({ health, loading, onOpenAbout }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1F2937] text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6B7280]" />
        <span>Connecting to backend...</span>
      </div>
    );
  }

  const isOnline = health?.backend_status === 'ok' && health?.model_loaded === true;

  return (
    <div className="relative">
      <button
        onClick={onOpenAbout}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] text-xs font-medium text-[#202123] dark:text-[#E3E3E3] hover:bg-[#F7F7F8] dark:hover:bg-[#2A2B2D] transition-colors focus:outline-none"
      >
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span className="hidden sm:inline">TextSQL-GPT-v1</span>
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#2D2E30] text-[#6B7280] dark:text-[#9CA3AF]">
          {isOnline ? (health.device.toUpperCase() === 'CUDA' ? 'CUDA GPU' : 'CPU') : 'Offline'}
        </span>
      </button>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-lg text-xs z-50 pointer-events-none">
          <div className="font-semibold text-[#202123] dark:text-[#E3E3E3] flex items-center justify-between mb-1.5">
            <span>Model Health & Status</span>
            {isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal">
                <CheckCircle2 className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-normal">
                <AlertCircle className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
          <div className="space-y-1 text-[#6B7280] dark:text-[#9CA3AF]">
            <div className="flex justify-between">
              <span>Parameters:</span>
              <span className="font-mono text-[#202123] dark:text-[#E3E3E3]">34.42M</span>
            </div>
            <div className="flex justify-between">
              <span>Context Length:</span>
              <span className="font-mono text-[#202123] dark:text-[#E3E3E3]">2048 tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Device:</span>
              <span className="font-mono text-[#202123] dark:text-[#E3E3E3]">{health?.device || 'Unknown'}</span>
            </div>
            {health?.error && (
              <div className="mt-1 text-rose-500 text-[11px]">
                {health.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
