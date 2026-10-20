import { act, render, screen } from '@testing-library/react';
import { Dexie } from 'dexie';
import { db } from '@/db/database';
import { StorageError } from '@/db/errors';
import { useUiStore } from '@/shared/store/ui-store';
import { AppProviders } from './AppProviders';
import { reportStorageError } from './storage-errors';

function renderApp() {
  return render(
    <AppProviders>
      <p>Journal</p>
    </AppProviders>,
  );
}

const banner = () => screen.queryByRole('alert');

describe('AppProviders database gate (US-02)', () => {
  beforeEach(() => {
    useUiStore.setState({ storageError: null, storageErrorBlocking: false, dbStatus: 'opening' });
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders the app once the database is open', async () => {
    renderApp();

    expect(await screen.findByText('Journal')).toBeInTheDocument();
    expect(banner()).not.toBeInTheDocument();
  });

  it('shows an upgrading status instead of the app while migrations run', async () => {
    let finishOpen: () => void = () => undefined;
    vi.spyOn(db, 'open').mockReturnValue(new Dexie.Promise<Dexie>((resolve) => (finishOpen = () => resolve(db))));
    vi.spyOn(db, 'onUpgradeStart').mockImplementation((listener) => {
      listener();
      return () => true;
    });

    renderApp();

    expect(await screen.findByRole('status')).toHaveTextContent('Upgrading your data…');
    expect(screen.queryByText('Journal')).not.toBeInTheDocument();

    await act(async () => finishOpen());

    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.queryByText('Upgrading your data…')).not.toBeInTheDocument();
  });

  it('explains a failed migration and still renders the app', async () => {
    vi.spyOn(db, 'open').mockRejectedValue(new StorageError('migration-failed', 'Migration to version 2 failed.'));

    renderApp();

    expect(await screen.findByText('Journal')).toBeInTheDocument();
    expect(banner()).toHaveTextContent('Your data could not be upgraded to this version of Ofelia. Nothing was changed.');
  });

  it('explains data from a newer version and keeps that message over follow-up errors', async () => {
    vi.spyOn(db, 'open').mockRejectedValue(new StorageError('newer-version', 'Newer data.'));

    renderApp();
    expect(await screen.findByText('Journal')).toBeInTheDocument();
    act(() => reportStorageError(new DOMException('closed', 'DatabaseClosedError')));

    expect(banner()).toHaveTextContent('This data was saved by a newer version of Ofelia');
  });

  it('warns when another tab upgrades the database', async () => {
    let notifyVersionChange: () => void = () => undefined;
    vi.spyOn(db, 'onVersionChange').mockImplementation((listener) => {
      notifyVersionChange = listener;
      return () => true;
    });

    renderApp();
    expect(await screen.findByText('Journal')).toBeInTheDocument();
    act(() => notifyVersionChange());

    expect(banner()).toHaveTextContent('This data was saved by a newer version of Ofelia');
  });
});
