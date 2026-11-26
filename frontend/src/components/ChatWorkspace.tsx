import React from 'react';
import { Database, Code, ArrowRight } from 'lucide-react';
import { QuestionInput } from './QuestionInput';
import { SchemaEditor } from './SchemaEditor';
import { SQLResult } from './SQLResult';
import type { ChatItem, SampleSchema } from '../types';

interface ChatWorkspaceProps {
  question: string;
  setQuestion: (q: string) => void;
  schema: string;
  setSchema: (s: string) => void;
  sampleSchemas: SampleSchema[];
  onSelectSample: (sample: SampleSchema) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  currentItem: ChatItem | null;
  onRegenerate: (item: ChatItem) => void;
  onToggleStar?: (id: string) => void;
  error?: string | null;
  suggestedQuestions?: string[];
  activeSample?: SampleSchema | null;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  question,
  setQuestion,
  schema,
  setSchema,
  sampleSchemas,
  onSelectSample,
  onGenerate,
  isGenerating,
  currentItem,
  onRegenerate,
  onToggleStar,
  error,
  suggestedQuestions,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcoming Header */}
        {!currentItem && (
          <div className="text-center space-y-2 pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F7F7F8] dark:bg-[#1E1F20] border border-[#E5E7EB] dark:border-[#374151] mb-2 shadow-2xs">
              <Database className="w-6 h-6 text-[#202123] dark:text-[#E3E3E3]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#202123] dark:text-[#E3E3E3]">
              Welcome to TextSQL-GPT
            </h1>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-md mx-auto">
              Convert natural language into accurate SQL queries using your database schema.
            </p>
          </div>
        )}

        {/* Quick Sample Presets (when no schema is typed yet) */}
        {!schema && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wider">
              Or pick a sample database to try immediately:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sampleSchemas.slice(0, 4).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="flex items-start justify-between p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-[#FAFAFA] dark:bg-[#18191A] hover:bg-white dark:hover:bg-[#1F2022] hover:border-[#D1D5DB] dark:hover:border-[#3D3E40] text-left transition-all shadow-2xs group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-[#202123] dark:text-[#E3E3E3] group-hover:text-black dark:group-hover:text-white flex items-center gap-1.5">
                      <span>{sample.name}</span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate mt-0.5">
                      {sample.description}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#202123] dark:group-hover:text-white shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Database Schema Editor Section */}
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#1A1A1C] p-4 sm:p-5 shadow-2xs">
          <SchemaEditor
            schema={schema}
            onChange={setSchema}
            onClear={() => setSchema('')}
            sampleSchemas={sampleSchemas}
            onSelectSample={onSelectSample}
            disabled={isGenerating}
          />
        </div>

        {/* Question Input Section */}
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#2D2E30] bg-white dark:bg-[#1A1A1C] p-4 sm:p-5 shadow-2xs">
          <QuestionInput
            question={question}
            onChange={setQuestion}
            onSubmit={onGenerate}
            onClear={() => setQuestion('')}
            isGenerating={isGenerating}
            suggestedQuestions={suggestedQuestions}
            onSelectSuggestion={(q) => setQuestion(q)}
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Generated SQL Result Output */}
        {currentItem && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[#202123] dark:text-[#E3E3E3]" />
              <span>Generated SQL Query</span>
            </div>
            <SQLResult
              item={currentItem}
              onRegenerate={onRegenerate}
              onToggleStar={onToggleStar}
            />
          </div>
        )}
      </div>
    </div>
  );
};
