import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RotateCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  Table as TableIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SQLCodeBlock } from './SQLCodeBlock';
import type { ChatItem, ExecuteSQLResponse } from '../types';
import { executeSQL } from '../services/api';

interface SQLResultProps {
  item: ChatItem;
  onRegenerate: (item: ChatItem) => void;
  onToggleStar?: (id: string) => void;
}

export const SQLResult: React.FC<SQLResultProps> = ({
  item,
  onRegenerate,
  onToggleStar,
}) => {
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<ExecuteSQLResponse | null>(
    item.sandboxResult || null
  );
  const [showSandbox, setShowSandbox] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.formattedSql || item.generatedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  const handleDownload = () => {
    const content = `-- TextSQL-GPT Generated Query\n-- Question: ${item.question}\n-- Generated: ${new Date(item.timestamp).toISOString()}\n\n${item.formattedSql || item.generatedSql};\n`;
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `textsql-gpt-${Date.now()}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunSandbox = async () => {
    setExecuting(true);
    setShowSandbox(true);
    try {
      const res = await executeSQL(
        item.schema,
        item.generatedSql,
        item.sampleData
      );
      setSandboxResult(res);
      item.sandboxResult = res;
    } catch (err: any) {
      setSandboxResult({
        success: false,
        error: err.message || 'Execution error in sandbox',
        columns: [],
        rows: [],
        row_count: 0,
        is_truncated: false,
      });
    } finally {
      setExecuting(false);
    }
  };

  const displaySql = item.formattedSql || item.generatedSql;

  return (
    <div className="w-full rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] shadow-sm overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E7EB] dark:border-[#2D2E30] bg-[#F9FAFB] dark:bg-[#18191A]">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {item.sqlValid ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SQLGlot Syntax Valid</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Syntax Check Note</span>
            </span>
          )}

          {/* Time & Tokens metric */}
          <span className="inline-flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.generationTime}s</span>
            <span className="text-[#D1D5DB] dark:text-[#4B5563]">•</span>
            <span>{item.generatedTokens} tokens</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Star Query */}
          {onToggleStar && (
            <button
              onClick={() => onToggleStar(item.id)}
              title={item.isStarred ? 'Unstar query' : 'Star query'}
              className={`p-1.5 rounded-lg border transition-colors ${
                item.isStarred
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                  : 'border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30]'
              }`}
            >
              <Star className={`w-4 h-4 ${item.isStarred ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Regenerate */}
          <button
            onClick={() => onRegenerate(item)}
            title="Regenerate query"
            className="p-1.5 rounded-lg border border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30] transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Copy SQL */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] text-xs font-medium text-[#202123] dark:text-[#E3E3E3] hover:bg-[#F9FAFB] dark:hover:bg-[#2D2E30] transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download SQL */}
          <button
            onClick={handleDownload}
            title="Download SQL file"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1E1F20] text-xs font-medium text-[#202123] dark:text-[#E3E3E3] hover:bg-[#F9FAFB] dark:hover:bg-[#2D2E30] transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Code Block Container */}
      <div className="p-4">
        <SQLCodeBlock code={displaySql} />

        {item.validationError && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <strong>Validation Notice:</strong> {item.validationError}
          </div>
        )}
      </div>

      {/* Safe Database Execution Sandbox Section */}
      <div className="border-t border-[#E5E7EB] dark:border-[#2D2E30] bg-[#FAFAFA] dark:bg-[#161718] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSandbox}
              disabled={executing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-[#202123] text-xs font-medium text-[#202123] dark:text-[#E3E3E3] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2E30] disabled:opacity-50 transition-colors shadow-2xs"
            >
              {executing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#202123] dark:text-[#E3E3E3]" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
              )}
              <span>Run in Safe Sandbox</span>
            </button>
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] hidden sm:inline">
              Safe read-only in-memory SQLite preview
            </span>
          </div>

          {sandboxResult && (
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className="text-xs text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#202123] dark:hover:text-[#E3E3E3] flex items-center gap-1"
            >
              <span>{showSandbox ? 'Hide Results' : 'Show Results'}</span>
              {showSandbox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Sandbox Output Preview Table */}
        {showSandbox && sandboxResult && (
          <div className="mt-3.5 pt-3.5 border-t border-[#E5E7EB] dark:border-[#2D2E30]">
            {sandboxResult.success ? (
              sandboxResult.rows.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="font-medium flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Returned {sandboxResult.row_count} row{sandboxResult.row_count === 1 ? '' : 's'}
                    </span>
                    {sandboxResult.is_truncated && (
                      <span className="text-amber-600 text-[11px]">
                        Preview capped at 50 rows
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto max-h-60 rounded-lg border border-[#E5E7EB] dark:border-[#374151]">
                    <table className="min-w-full divide-y divide-[#E5E7EB] dark:divide-[#374151] text-xs">
                      <thead className="bg-[#F3F4F6] dark:bg-[#1F2937]">
                        <tr>
                          {sandboxResult.columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="px-3 py-2 text-left font-semibold text-[#202123] dark:text-[#E3E3E3]"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#374151] bg-white dark:bg-[#1E1F20]">
                        {sandboxResult.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? 'bg-white dark:bg-[#1E1F20]' : 'bg-[#F9FAFB] dark:bg-[#18191A]'}
                          >
                            {row.map((val, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3 py-1.5 text-[#4B5563] dark:text-[#D1D5DB] font-mono whitespace-nowrap"
                              >
                                {val === null ? (
                                  <span className="text-[#9CA3AF] italic">NULL</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] italic p-2 bg-white dark:bg-[#1E1F20] rounded border border-[#E5E7EB] dark:border-[#374151]">
                  Query executed successfully, but 0 rows were returned (table is empty or query filters matched no records).
                </div>
              )
            ) : (
              <div className="text-xs p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                <strong>Execution Error:</strong> {sandboxResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
