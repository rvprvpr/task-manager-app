import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

test('creating a task refreshes the list', async () => {
  const fetchSpy = vi.spyOn(global as any, 'fetch');
  fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) } as any);
  fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 1 } }) } as any);
  fetchSpy.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: [{ id: 1, title: 'T1', description: null, priority: 'medium', created_at: new Date().toISOString() }],
    }),
  } as any);

  render(<App />);
  await screen.findByText(/No tasks yet/);

  await userEvent.type(screen.getByLabelText(/Title/i), 'T1');
  await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));

  await screen.findByText('T1');
});
