import { useEffect, useState } from 'react';
import { listTasks, Task } from '@/lib/api';

type Props = { refreshKey?: number };

export default function TaskList({ refreshKey = 0 }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    listTasks()
      .then(data => {
        if (cancelled) return;
        setTasks(data);
        setStatus('ready');
      })
      .catch(e => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load tasks');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (status === 'loading') return <div className="mx-auto max-w-xl p-6 text-sm text-gray-600">Loading…</div>;
  if (status === 'error') return <div className="mx-auto max-w-xl p-6 text-sm text-red-600">Error: {error}</div>;
  if (tasks.length === 0) return <div className="mx-auto max-w-xl p-6 text-sm text-gray-600">No tasks yet.</div>;

  return (
    <div className="mx-auto max-w-xl p-6 space-y-3">
      <h2 className="text-xl font-semibold">Tasks</h2>
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
        {tasks.map(t => (
          <li key={t.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                {t.description && <div className="text-sm text-gray-600">{t.description}</div>}
              </div>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">{t.priority}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
