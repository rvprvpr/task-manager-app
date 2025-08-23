import { useEffect, useMemo, useState } from 'react';
import { listTasks, Task, updateTask, deleteTask } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = { refreshKey?: number };

const editSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Max 255 chars'),
  description: z.string().max(1000, 'Max 1000 chars').optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
});
type EditValues = z.infer<typeof editSchema>;

export default function TaskList({ refreshKey = 0 }: Props) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [error, setError] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority'>('date_desc');
  const [editing, setEditing] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const visibleTasks = useMemo(() => {
    let data = [...tasks];
    if (filterPriority !== 'all') {
      data = data.filter(t => t.priority === filterPriority);
    }
    if (sortBy === 'date_desc') {
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'date_asc') {
      data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'priority') {
      const order: Record<Task['priority'], number> = { low: 0, medium: 1, high: 2 };
      data.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return data;
  }, [tasks, filterPriority, sortBy]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
    values: editing
      ? {
          title: editing.title,
          description: editing.description || '',
          priority: editing.priority,
        }
      : undefined,
  });

  const onEditSubmit = async (values: EditValues) => {
    if (!editing) return;
    try {
      const updated = await updateTask(editing.id, {
        title: values.title.trim(),
        description: values.description?.trim() || '',
        priority: values.priority,
      });
      setTasks(prev => prev.map(t => (t.id === editing.id ? updated : t)));
      toast({ title: 'Task updated', description: 'Your changes were saved.' });
      setEditing(null);
      reset();
    } catch (e: any) {
      toast({ title: 'Failed to update task', description: e?.message || 'Request failed', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (deletingId == null) return;
    try {
      await deleteTask(deletingId);
      setTasks(prev => prev.filter(t => t.id !== deletingId));
      toast({ title: 'Task deleted', description: 'The task was removed.' });
      setDeletingId(null);
    } catch (e: any) {
      toast({ title: 'Failed to delete task', description: e?.message || 'Request failed', variant: 'destructive' });
    }
  };

  if (status === 'loading') return <div className="mx-auto max-w-xl p-6 text-sm text-gray-600">Loading…</div>;
  if (status === 'error') return <div className="mx-auto max-w-xl p-6 text-sm text-red-600">Error: {error}</div>;
  if (tasks.length === 0) return <div className="mx-auto max-w-xl p-6 text-sm text-gray-600">No tasks yet.</div>;

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h2 className="text-xl font-semibold">Tasks</h2>

      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Filter by priority</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as any)}
            aria-label="Filter"
          >
            <option value="all">all</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Sort</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            aria-label="Sort"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
        {visibleTasks.map(t => (
          <li key={t.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium break-words">{t.title}</div>
                {t.description && <div className="text-sm text-gray-600 break-words">{t.description}</div>}
                <div className="mt-1 text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">{t.priority}</span>
                <button
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                  onClick={() => setEditing(t)}
                  aria-label={`Edit ${t.title}`}
                >
                  Edit
                </button>
                <button
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  onClick={() => setDeletingId(t.id)}
                  aria-label={`Delete ${t.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('priority')}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
              {errors.priority && <p className="text-sm text-red-600">{errors.priority.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="rounded-md border border-gray-300 px-3 py-2 text-sm">Cancel</button>
              </DialogClose>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
