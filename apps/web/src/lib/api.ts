import type { Workspace } from '@safer/contracts';
import { useQuery } from '@tanstack/react-query';
export const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';
const base = import.meta.env.VITE_API_BASE_URL || '';
export async function api<T>(
  path: string,
  body?: unknown,
  method = body ? 'POST' : 'GET',
  idempotency: string = crypto.randomUUID(),
): Promise<T> {
  if (isDemo) {
    const { demoApi } = await import('../mocks/demo-api');
    return demoApi(path, body, method, idempotency) as T;
  }
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotency },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.headers.get('content-type')?.includes('json')) {
    throw new Error(
      'The API returned a web page instead of JSON. Check the API URL and server routing.',
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The API returned invalid JSON. Please try again.');
  }
  if (!response.ok) throw new Error(data.message || 'Unable to complete the request.');
  return data;
}
export function useWorkspace() {
  return useQuery({ queryKey: ['workspace'], queryFn: () => api<Workspace>('/workspace') });
}
