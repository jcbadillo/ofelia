import { expect, test, type Page } from '@playwright/test';

// Next.js adds its own empty role="alert" route announcer, so match the banner by text.
const storageBanner = (page: Page) => page.getByRole('alert').filter({ hasText: 'Changes are not being saved' });

// US-01: every change is saved automatically and survives a reload.
test('typed content is saved without a save action and survives a reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Block content' });
  await editor.pressSequentially('Saved automatically');
  await page.waitForTimeout(1000);

  await page.reload();

  await expect(page.getByRole('textbox', { name: 'Block content' })).toHaveValue('Saved automatically');
  await expect(storageBanner(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('shows a banner when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined });
  });

  await page.goto('/');

  await expect(storageBanner(page)).toBeVisible();
});

// US-02: an older app never writes over data from a newer schema version.
test('shows a banner when the stored data comes from a newer version', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Block content' })).toBeVisible();

  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('ofelia');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const tx = request.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').put({ key: 'schemaVersion', value: 99 });
          tx.oncomplete = () => {
            request.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();

  await expect(page.getByRole('alert').filter({ hasText: 'saved by a newer version of Ofelia' })).toBeVisible();
});
