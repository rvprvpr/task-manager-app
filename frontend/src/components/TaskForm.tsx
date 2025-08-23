import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTask, TaskPayload } from '../lib/api';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Max 255 chars'),
  description: z.string().max(1000, 'Max 1000 chars').optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TaskForm() {
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setStatus({ type: 'idle' });
    const payload: TaskPayload = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      priority: values.priority || 'medium',
    };
    try {
      await createTask(payload);
      setStatus({ type: 'success', message: 'Task created successfully.' });
      reset({ title: '', description: '', priority: 'medium' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e?.message || 'Failed to create task' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Add Task</h1>

      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Complete project"
          {...register('title')}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Optional details..."
          {...register('description')}
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="priority" className="block text-sm font-medium">
          Priority
        </label>
        <select
          id="priority"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('priority')}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        {errors.priority && <p className="text-sm text-red-600">{errors.priority.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Create Task'}
        </button>
        {status.type === 'success' && (
          <span className="text-sm text-green-700">{status.message}</span>
        )}
        {status.type === 'error' && <span className="text-sm text-red-700">{status.message}</span>}
      </div>
    </form>
  );
}
