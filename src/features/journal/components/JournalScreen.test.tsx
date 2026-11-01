import { render, screen } from '@testing-library/react';
import { db } from '@/db/database';
import { AppProviders } from '@/shared/providers/AppProviders';
import { useUiStore } from '@/shared/store/ui-store';
import { buildBlock } from '@/test/factories';
import { JournalScreen } from './JournalScreen';

function renderJournal() {
  return render(
    <AppProviders>
      <JournalScreen />
    </AppProviders>,
  );
}

describe('JournalScreen (US-03)', () => {
  beforeEach(async () => {
    // Only fake Date: Dexie and Testing Library still need real timers.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 27, 9, 0));
    await db.blocks.clear();
    useUiStore.setState({ storageError: null, storageErrorBlocking: false });
  });

  afterEach(() => vi.useRealTimers());

  it('titles the page with today in a readable format', async () => {
    renderJournal();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Sunday, 27 Sep 2026' });
    expect(heading.querySelector('time')).toHaveAttribute('datetime', '2026-09-27');
    expect(document.title).toBe('Sunday, 27 Sep 2026 · Ofelia');
  });

  it('restores the previous tab title when the page goes away', async () => {
    document.title = 'Ofelia';
    const { unmount } = renderJournal();
    await screen.findByRole('heading', { level: 1 });

    unmount();

    expect(document.title).toBe('Ofelia');
  });

  it('stays on the day it opened on after midnight, even when re-rendered', async () => {
    const { rerender } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: 'Sunday, 27 Sep 2026' });

    vi.setSystemTime(new Date(2026, 8, 28, 0, 5));
    rerender(
      <AppProviders>
        <JournalScreen />
      </AppProviders>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sunday, 27 Sep 2026');
  });

  it('shows one empty block with the cursor ready when today has no content', async () => {
    renderJournal();

    const editor = await screen.findByRole('textbox', { name: 'Block content' });
    expect(screen.getAllByRole('textbox', { name: 'Block content' })).toHaveLength(1);
    expect(editor).toHaveValue('');
    expect(editor).toHaveFocus();
    expect(await db.blocks.count()).toBe(0);
  });

  it('shows the existing blocks without taking focus when today has content', async () => {
    await db.blocks.put(buildBlock({ pageDate: '2026-09-27', content: 'Already here' }));

    renderJournal();

    expect(await screen.findByDisplayValue('Already here')).not.toHaveFocus();
    expect(screen.getAllByRole('textbox', { name: 'Block content' })).toHaveLength(1);
  });

  it('ignores blocks of other days', async () => {
    await db.blocks.put(buildBlock({ pageDate: '2026-09-26', content: 'Yesterday' }));

    renderJournal();

    const editor = await screen.findByRole('textbox', { name: 'Block content' });
    expect(editor).toHaveValue('');
    expect(editor).toHaveFocus();
  });
});
