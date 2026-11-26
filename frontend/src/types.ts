export interface ModelHealth {
  backend_status: string;
  model_loaded: boolean;
  model_name: string;
  architecture: string;
  device: string;
  parameter_count: number;
  vocab_size: number;
  context_length: number;
  global_step?: number;
  phase?: string;
  error?: string | null;
}

export interface GenerateSQLResponse {
  generated_sql: string;
  formatted_sql: string;
  sql_valid: boolean;
  validation_error?: string | null;
  statement_type?: string | null;
  generation_time: number;
  prompt_tokens: number;
  generated_tokens: number;
  status: string;
  error?: string | null;
}

export interface ValidateSQLResponse {
  is_valid: boolean;
  formatted_sql: string;
  error?: string | null;
  statement_type?: string | null;
  tables: string[];
}

export interface ExecuteSQLResponse {
  success: boolean;
  error?: string | null;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  is_truncated: boolean;
}

export interface SampleSchema {
  id: string;
  name: string;
  description: string;
  schema: string;
  sample_data?: string;
  questions: string[];
}

export interface ChatItem {
  id: string;
  timestamp: number;
  question: string;
  schema: string;
  sampleData?: string;
  generatedSql: string;
  formattedSql: string;
  sqlValid: boolean;
  validationError?: string | null;
  generationTime: number;
  promptTokens: number;
  generatedTokens: number;
  isStarred?: boolean;
  sandboxResult?: ExecuteSQLResponse | null;
}

export interface UserSettings {
  darkMode: boolean;
  maxTokens: number;
  temperature: number;
  autoFormat: boolean;
  enableSandbox: boolean;
}
