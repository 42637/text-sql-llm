import type {
  ModelHealth,
  GenerateSQLResponse,
  ValidateSQLResponse,
  ExecuteSQLResponse,
  SampleSchema,
} from '../types';

// Read API base URL from Vite environment variable (set in Vercel or .env)
// Falls back to empty string (relative path / local proxy) when not provided
const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : '';

export async function checkHealth(): Promise<ModelHealth> {
  const url = `${API_BASE}/health`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Fallback to /api/health
      const fallbackRes = await fetch(`${API_BASE}/api/health`);
      if (!fallbackRes.ok) {
        throw new Error(`Health check failed with status ${fallbackRes.status}`);
      }
      return fallbackRes.json();
    }
    return res.json();
  } catch (err: any) {
    // If /health failed, try /api/health
    const fallbackRes = await fetch(`${API_BASE}/api/health`);
    if (!fallbackRes.ok) {
      throw new Error(err.message || 'Health check failed');
    }
    return fallbackRes.json();
  }
}

export async function generateSQL(
  question: string,
  schema: string,
  maxNewTokens: number = 256,
  temperature: number = 0.0
): Promise<GenerateSQLResponse> {
  const url = `${API_BASE}/generate`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        schema,
        max_new_tokens: maxNewTokens,
        temperature,
      }),
    });
  } catch {
    // Fallback to /api/generate-sql
    res = await fetch(`${API_BASE}/api/generate-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        schema,
        max_new_tokens: maxNewTokens,
        temperature,
      }),
    });
  }

  const data = await res.json();
  if (!res.ok && !data.error) {
    throw new Error(`Generation failed with HTTP status ${res.status}`);
  }
  return data;
}

export async function validateSQL(
  sql: string,
  dialect: string = 'sqlite'
): Promise<ValidateSQLResponse> {
  const res = await fetch(`${API_BASE}/validate-sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, dialect }),
  }).catch(() =>
    fetch(`${API_BASE}/api/validate-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, dialect }),
    })
  );

  if (!res.ok) {
    throw new Error(`Validation failed with HTTP status ${res.status}`);
  }
  return res.json();
}

export async function executeSQL(
  schema: string,
  sql: string,
  sampleData?: string,
  maxRows: number = 50
): Promise<ExecuteSQLResponse> {
  const combinedSchema = sampleData ? `${schema}\n\n${sampleData}` : schema;

  const res = await fetch(`${API_BASE}/execute-sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema: combinedSchema,
      sql,
      max_rows: maxRows,
    }),
  }).catch(() =>
    fetch(`${API_BASE}/api/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: combinedSchema,
        sql,
        max_rows: maxRows,
      }),
    })
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Execution failed with HTTP status ${res.status}`);
  }
  return res.json();
}

export async function fetchSampleSchemas(): Promise<SampleSchema[]> {
  try {
    const res = await fetch(`${API_BASE}/sample-schemas`);
    if (res.ok) return res.json();
  } catch {}
  const res = await fetch(`${API_BASE}/api/sample-schemas`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sample schemas`);
  }
  return res.json();
}
