export type TaskPayload = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { msg: string; path?: string; param?: string }[];
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function createTask(payload: TaskPayload) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiResponse<any>;
  if (!res.ok || !json.success) {
    const detail =
      json.errors?.map(e => e.msg).join(', ') || json.message || 'Request failed';
    throw new Error(detail);
  }
  return json.data;
}
