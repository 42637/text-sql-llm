import React from 'react';

interface SQLCodeBlockProps {
  code: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const SQLCodeBlock: React.FC<SQLCodeBlockProps> = ({
  code,
  className = '',
  showLineNumbers = true,
}) => {
  const lines = code.split('\n');

  // Syntax highlighting for SQL tokens
  const highlightLine = (line: string): React.ReactNode => {
    // Regex matching comments, string literals, numbers, keywords, and functions
    const regex = /(--.*$|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\b\d+(?:\.\d+)?\b|\b(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|DROP|ALTER|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|ON|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|AS|ASC|DESC|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|DEFAULT|AUTOINCREMENT|REAL|INTEGER|TEXT|BLOB|BOOLEAN|VARCHAR|DATETIME|DATE)\b|\b(?:COUNT|SUM|AVG|MIN|MAX|ROUND|COALESCE|UPPER|LOWER|LENGTH|SUBSTR|TRIM|IFNULL)\b)/gi;

    const parts = line.split(regex);
    return parts.map((part, index) => {
      if (!part) return null;

      // Comment
      if (part.startsWith('--') || part.startsWith('/*')) {
        return (
          <span key={index} className="text-[#6B7280] dark:text-[#9CA3AF] italic">
            {part}
          </span>
        );
      }
      // String literal
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={index} className="text-[#059669] dark:text-[#34D399]">
            {part}
          </span>
        );
      }
      // Number
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        return (
          <span key={index} className="text-[#D97706] dark:text-[#FBBF24]">
            {part}
          </span>
        );
      }
      // SQL Functions
      if (/^(?:COUNT|SUM|AVG|MIN|MAX|ROUND|COALESCE|UPPER|LOWER|LENGTH|SUBSTR|TRIM|IFNULL)$/i.test(part)) {
        return (
          <span key={index} className="text-[#7C3AED] dark:text-[#A78BFA] font-semibold">
            {part.toUpperCase()}
          </span>
        );
      }
      // SQL Keywords
      if (/^(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|DROP|ALTER|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|ON|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|AS|ASC|DESC|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|DEFAULT|AUTOINCREMENT|REAL|INTEGER|TEXT|BLOB|BOOLEAN|VARCHAR|DATETIME|DATE)$/i.test(part)) {
        return (
          <span key={index} className="text-[#1D4ED8] dark:text-[#60A5FA] font-bold">
            {part.toUpperCase()}
          </span>
        );
      }
      // Plain text / identifiers
      return <span key={index} className="text-[#111827] dark:text-[#F3F4F6]">{part}</span>;
    });
  };

  return (
    <div className={`relative overflow-x-auto rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] text-sm font-mono ${className}`}>
      <div className="flex min-w-full">
        {showLineNumbers && (
          <div className="select-none py-3.5 pl-3.5 pr-2.5 text-right text-xs text-[#9CA3AF] dark:text-[#6B7280] border-r border-[#E5E7EB] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#1F2937]">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <div className="p-3.5 overflow-x-auto flex-1 font-mono text-sm leading-6">
          <pre className="m-0 p-0 whitespace-pre">
            {lines.map((line, i) => (
              <div key={i} className="min-h-[1.5rem]">
                {highlightLine(line)}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};
