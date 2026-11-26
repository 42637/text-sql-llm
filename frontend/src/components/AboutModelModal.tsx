import React from 'react';
import { X, Cpu, Layers, HardDrive, Hash, CheckCircle, Database } from 'lucide-react';
import type { ModelHealth } from '../types';

interface AboutModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: ModelHealth | null;
}

export const AboutModelModal: React.FC<AboutModelModalProps> = ({
  isOpen,
  onClose,
  health,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2D2E30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] flex items-center justify-center text-white dark:text-[#131314]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#202123] dark:text-[#E3E3E3]">
                TextSQL-GPT-v1 Architecture
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Original Trained Model Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Overview Banner */}
          <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#18191A] border border-[#E5E7EB] dark:border-[#2D2E30] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-[#202123] dark:text-[#E3E3E3]">
                34,423,808 Parameters
              </div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Decoder-only Causal Transformer
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Checkpoint Strictly Loaded</span>
            </div>
          </div>

          {/* Model Specification Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#161718]">
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Transformer Layers</span>
              </div>
              <div className="text-sm font-semibold font-mono text-[#202123] dark:text-[#E3E3E3]">
                8 Layers
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#161718]">
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Attention Heads</span>
              </div>
              <div className="text-sm font-semibold font-mono text-[#202123] dark:text-[#E3E3E3]">
                8 Heads (head_dim=64)
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#161718]">
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 mb-1">
                <Hash className="w-3.5 h-3.5" />
                <span>Hidden Dimension</span>
              </div>
              <div className="text-sm font-semibold font-mono text-[#202123] dark:text-[#E3E3E3]">
                d_model = 512 (d_ff = 2048)
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#161718]">
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Context Window</span>
              </div>
              <div className="text-sm font-semibold font-mono text-[#202123] dark:text-[#E3E3E3]">
                2048 Tokens
              </div>
            </div>
          </div>

          {/* Tokenizer & Special Tokens */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#202123] dark:text-[#E3E3E3] text-xs">
              Original BPE Tokenizer & Special Tokens
            </h4>
            <div className="p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#161718] border border-[#E5E7EB] dark:border-[#2D2E30] space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|unk|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|pad|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|question|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|schema|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|sql|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">&lt;|endoftext|&gt;</span>
                <span className="text-[#202123] dark:text-[#E3E3E3]">ID 5</span>
              </div>
            </div>
          </div>

          {/* Checkpoint Details */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#202123] dark:text-[#E3E3E3] text-xs">
              Loaded Checkpoint Metadata
            </h4>
            <div className="p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#161718] border border-[#E5E7EB] dark:border-[#2D2E30] space-y-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              <div><strong>File:</strong> phase16E_step_38007.pt (413 MB)</div>
              <div><strong>Global Step:</strong> {health?.global_step || 38007}</div>
              <div><strong>Phase:</strong> {health?.phase || 'phase16E'}</div>
              <div><strong>Runtime Device:</strong> {health?.device || 'cpu'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] dark:border-[#2D2E30] bg-[#F9FAFB] dark:bg-[#18191A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] text-white dark:text-[#131314] font-medium text-xs hover:bg-black dark:hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
