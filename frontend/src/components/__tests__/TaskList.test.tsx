import { render, screen, waitFor } from '@testing-library/react';
import TaskList from '../TaskList';
import { vi } from 'vitest';

const mockFetch = (data: any, ok = true) => {
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok,
    json: async () => data,
  } as any);
};

afterEach(() => vi.restoreAllMocks());

test('shows empty state', async () => {
  mockFetch({ success: true, data: [] });
  render(<TaskList />);
  await waitFor(() => expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument());
});

test('renders items', async () => {
  mockFetch({
    success: true,
    data: [
      { id: 1, title: 'A', description: null, priority: 'medium', created_at: new Date().toISOString() },
    ],
  });
  render(<TaskList />);
  await screen.findByText('A');
});

test('shows error', async () => {
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({ success: false, message: 'boom' }),
  } as any);
  render(<TaskList />);
  await screen.findByText(/Error: boom/);
});
