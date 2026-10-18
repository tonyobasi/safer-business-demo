import type { Workspace } from '@safer/contracts';
import { useQuery } from '@tanstack/react-query';
const base = import.meta.env.VITE_API_BASE_URL || '';
export async function api<T>(
  path: string,
  body?: unknown,
  method = body ? 'POST' : 'GET',
  idempotency = crypto.randomUUID(),
): Promise<T> {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotency },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete the request.');
  return data;
}
export function useWorkspace() {
  return useQuery({ queryKey: ['workspace'], queryFn: () => api<Workspace>('/workspace') });
}
export const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';
