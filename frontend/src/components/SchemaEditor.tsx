import React, { useState } from 'react';
import { Database, X, BookOpen, ChevronDown } from 'lucide-react';
import type { SampleSchema } from '../types';

interface SchemaEditorProps {
  schema: string;
  onChange: (s: string) => void;
  onClear: () => void;
  sampleSchemas: SampleSchema[];
  onSelectSample: (sample: SampleSchema) => void;
  disabled?: boolean;
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  schema,
  onChange,
  onClear,
  sampleSchemas,
  onSelectSample,
  disabled = false,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#202123] dark:text-[#E3E3E3]" />
          <span>Database Schema</span>
        </label>

        <div className="flex items-center gap-2">
          {/* Preset Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs px-2.5 py-1 rounded-md border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] text-[#4B5563] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#2D2E30] flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sample Schemas</span>
              <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
            </button>

            {showPresets && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPresets(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-xl p-1.5 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Load Preset Schema
                  </div>
                  {sampleSchemas.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        onSelectSample(sample);
                        setShowPresets(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30] transition-colors"
                    >
                      <div className="text-xs font-medium text-[#202123] dark:text-[#E3E3E3]">
                        {sample.name}
                      </div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                        {sample.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {schema && (
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
      </div>

      <div className="relative rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#18191A] focus-within:border-[#202123] dark:focus-within:border-[#9E9E9E] focus-within:ring-1 focus-within:ring-[#202123] dark:focus-within:ring-[#9E9E9E] transition-all">
        <textarea
          value={schema}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your CREATE TABLE statements here...&#10;&#10;CREATE TABLE employees (&#10;    id INTEGER PRIMARY KEY,&#10;    name TEXT NOT NULL,&#10;    salary REAL&#10;);"
          disabled={disabled}
          rows={5}
          className="w-full p-3.5 font-mono text-xs leading-relaxed bg-transparent text-[#202123] dark:text-[#E3E3E3] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] resize-y focus:outline-none"
        />
        <div className="px-3.5 py-1.5 border-t border-[#E5E7EB] dark:border-[#2A2B2D] flex items-center justify-between text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
          <span>SQL DDL Schema Editor</span>
          <span className="font-mono">{schema.trim() ? `${schema.split('\n').length} lines` : 'Empty'}</span>
        </div>
      </div>
    </div>
  );
};
