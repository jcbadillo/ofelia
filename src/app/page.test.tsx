import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/db/database';
import { today } from '@/domain/dates';
import { AppProviders } from '@/shared/providers/AppProviders';
import { useUiStore } from '@/shared/store/ui-store';
import HomePage from './page';

function renderApp() {
  return render(
    <AppProviders>
      <HomePage />
    </AppProviders>,
  );
}

describe('HomePage autosave (US-01)', () => {
  beforeEach(async () => {
    await db.blocks.clear();
    useUiStore.setState({ storageError: null });
  });

  afterEach(() => vi.restoreAllMocks());

  it('saves typed content within 1 second, without a save action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(await screen.findByRole('textbox', { name: 'Block content' }), 'Hello journal');

    const start = Date.now();
    await waitFor(async () => {
      const blocks = await db.blocks.where('pageDate').equals(today()).toArray();
      expect(blocks.map((b) => b.content)).toEqual(['Hello journal']);
    });
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('shows the saved content again after a reload', async () => {
    const user = userEvent.setup();
    const first = renderApp();
    await user.type(await screen.findByRole('textbox', { name: 'Block content' }), 'Survives reload');
    first.unmount(); // flushes pending writes, like pagehide does in the browser

    await waitFor(async () => expect((await db.blocks.toArray())[0]?.content).toBe('Survives reload'));
    renderApp();

    expect(await screen.findByDisplayValue('Survives reload')).toBeInTheDocument();
  });

  it('does not persist an empty day', async () => {
    renderApp();
    await screen.findByRole('textbox', { name: 'Block content' });
    expect(await db.blocks.count()).toBe(0);
  });

  it('shows an error banner when storage is full', async () => {
    vi.spyOn(db.blocks, 'put').mockRejectedValue(new DOMException('full', 'QuotaExceededError'));
    const user = userEvent.setup();
    renderApp();

    await user.type(await screen.findByRole('textbox', { name: 'Block content' }), 'x');

    expect(await screen.findByRole('alert')).toHaveTextContent(/changes are not being saved.*storage is full/i);
  });
});
