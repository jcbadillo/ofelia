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
