import React, { useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';

interface QuestionInputProps {
  question: string;
  onChange: (q: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  suggestedQuestions?: string[];
  onSelectSuggestion?: (q: string) => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  onChange,
  onSubmit,
  onClear,
  isGenerating,
  disabled = false,
  suggestedQuestions = [],
  onSelectSuggestion,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && question.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#202123] dark:text-[#E3E3E3]" />
          <span>Ask your question</span>
        </label>
        {question && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#202123] dark:hover:text-[#E3E3E3] flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-sm focus-within:border-[#202123] dark:focus-within:border-[#9E9E9E] focus-within:ring-1 focus-within:ring-[#202123] dark:focus-within:ring-[#9E9E9E] transition-all">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Find the top 10 customers by total purchase amount..."
          disabled={disabled || isGenerating}
          rows={2}
          className="w-full p-3.5 pb-12 bg-transparent text-[#202123] dark:text-[#E3E3E3] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] text-sm resize-none focus:outline-none leading-relaxed"
        />

        {/* Bottom bar inside textarea card */}
        <div className="absolute bottom-2.5 left-3.5 right-2.5 flex items-center justify-between pt-1 border-t border-[#F3F4F6] dark:border-[#2A2B2D]">
          <span className="hidden sm:inline text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
            Press <kbd className="px-1 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#2D2E30] text-[10px] font-mono">Enter ↵</kbd> to generate, <kbd className="px-1 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#2D2E30] text-[10px] font-mono">Shift+Enter</kbd> for new line
          </span>
          <span className="sm:hidden text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
            Natural language
          </span>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!question.trim() || isGenerating || disabled}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#202123] dark:bg-[#E3E3E3] text-white dark:text-[#131314] text-xs font-medium hover:bg-black dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate SQL</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggested question chips */}
      {suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] mr-1">Suggestions:</span>
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSuggestion && onSelectSuggestion(sq)}
              className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1E1F20] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30] hover:text-[#202123] dark:hover:text-white transition-colors truncate max-w-xs"
            >
              {sq}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
