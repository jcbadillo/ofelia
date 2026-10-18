import { expect, test } from '@playwright/test';

test('home page shows an empty block ready to type', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Block content' })).toBeFocused();
});
