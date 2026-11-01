import { expect, test, type Page } from '@playwright/test';

// Acceptance criteria for US-03: one test per criterion, named after it.

const editors = (page: Page) => page.getByRole('textbox', { name: 'Block content' });

test.describe('local time zone', () => {
  // 2026-09-26T12:00Z is already Sunday 27 Sep at UTC+14, so a UTC-based "today" would be wrong.
  test.use({ timezoneId: 'Pacific/Kiritimati' });

  test('The app opens on today\'s date, based on the local time zone', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-26T12:00:00Z'));

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sunday, 27 Sep 2026');
    await expect(page.locator('h1 time')).toHaveAttribute('datetime', '2026-09-27');
  });
});

test('If today\'s page has no content, it shows one empty block with the cursor ready to type', async ({ page }) => {
  await page.goto('/');

  await expect(editors(page)).toHaveCount(1);
  await expect(editors(page)).toHaveValue('');
  await expect(editors(page)).toBeFocused();

  await page.keyboard.type('Typing right away');
  await expect(editors(page)).toHaveValue('Typing right away');
});

test('The page title shows the date in a readable format (e.g. "Sunday, 27 Sep 2026")', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 8, 27, 10, 0));

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sunday, 27 Sep 2026');
  await expect(page).toHaveTitle('Sunday, 27 Sep 2026 · Ofelia');
});
