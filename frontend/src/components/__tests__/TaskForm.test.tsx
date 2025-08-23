import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../TaskForm';
import { Toaster } from '@/components/ui/toaster';
import { vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

test('requires title', async () => {
  render(
    <>
      <Toaster />
      <TaskForm />
    </>
  );
  await userEvent.click(screen.getByRole('button', { name: /create task/i }));
  expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
});

test('submit success shows toast and calls onCreated', async () => {
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { id: 1 } }),
  } as any);
  const onCreated = vi.fn();
  render(
    <>
      <Toaster />
      <TaskForm onCreated={onCreated} />
    </>
  );
  await userEvent.type(screen.getByLabelText(/Title/i), 'X');
  await userEvent.click(screen.getByRole('button', { name: /create task/i }));
  await screen.findByText(/Task created/i);
  expect(onCreated).toHaveBeenCalled();
});

test('submit error shows backend detail', async () => {
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({ success: false, message: 'Validation failed', errors: [{ msg: 'Title is required' }] }),
  } as any);
  render(
    <>
      <Toaster />
      <TaskForm />
    </>
  );
  await userEvent.type(screen.getByLabelText(/Title/i), ' ');
  await userEvent.click(screen.getByRole('button', { name: /create task/i }));
  await screen.findByText(/Title is required/i);
});
