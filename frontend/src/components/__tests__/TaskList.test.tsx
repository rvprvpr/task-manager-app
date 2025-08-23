import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../TaskList';
import { vi } from 'vitest';

const queueFetch = (responses: { ok: boolean; body: any }[]) => {
  const spy = vi.spyOn(global as any, 'fetch');
  let i = 0;
  spy.mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return {
      ok: r.ok,
      json: async () => r.body,
    } as any;
  });
  return spy;
};

afterEach(() => vi.restoreAllMocks());

test('shows empty state', async () => {
  queueFetch([{ ok: true, body: { success: true, data: [] } }]);
  render(<TaskList />);
  await waitFor(() => expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument());
});

test('renders items', async () => {
  queueFetch([
    {
      ok: true,
      body: {
        success: true,
        data: [{ id: 1, title: 'A', description: null, priority: 'medium', created_at: new Date().toISOString() }],
      },
    },
  ]);
  render(<TaskList />);
  await screen.findByText('A');
});

test('shows error', async () => {
  queueFetch([{ ok: false, body: { success: false, message: 'boom' } }]);
  render(<TaskList />);
  await screen.findByText(/Error: boom/);
});

test('filter and sort controls work', async () => {
  const now = new Date();
  const older = new Date(now.getTime() - 1000);
  queueFetch([
    {
      ok: true,
      body: {
        success: true,
        data: [
          { id: 1, title: 'A', description: null, priority: 'low', created_at: older.toISOString() },
          { id: 2, title: 'B', description: null, priority: 'high', created_at: now.toISOString() },
        ],
      },
    },
  ]);
  render(<TaskList />);
  await screen.findByText('A');
  const sort = screen.getByLabelText('Sort');
  await userEvent.selectOptions(sort, 'Priority');
  const items = screen.getAllByRole('listitem');
  expect(items.length).toBe(2);
});

test('edit and delete flows', async () => {
  const createdAt = new Date().toISOString();
  queueFetch([
    { ok: true, body: { success: true, data: [{ id: 1, title: 'A', description: '', priority: 'medium', created_at: createdAt }] } },
    { ok: true, body: { success: true, data: { id: 1, title: 'AA', description: '', priority: 'high', created_at: createdAt } } },
    { ok: true, body: { success: true, message: 'Task deleted successfully' } },
  ]);
  render(<TaskList />);
  await screen.findByText('A');
  await userEvent.click(screen.getByRole('button', { name: /edit a/i }));
  const titleInput = await screen.findByLabelText(/Title/i);
  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'AA');
  await userEvent.selectOptions(screen.getByLabelText(/Priority/i), 'high');
  await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
  await screen.findByText('AA');
  await userEvent.click(screen.getByRole('button', { name: /delete aa/i }));
  const confirm = await screen.findByRole('button', { name: /delete/i });
  await userEvent.click(confirm);
  await waitFor(() => expect(screen.queryByText('AA')).not.toBeInTheDocument());
});
