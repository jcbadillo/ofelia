import { expect, test, type Page } from '@playwright/test';
import type { Block } from '../src/domain/types';

// Acceptance criteria for US-01: one test per criterion, named after it.

const SAVE_DEADLINE_MS = 1000;
const POLL = { timeout: SAVE_DEADLINE_MS, intervals: [50] };

const editors = (page: Page) => page.getByRole('textbox', { name: 'Block content' });

// Next.js adds its own empty role="alert" route announcer, so match the banner by text.
const storageBanner = (page: Page) => page.getByRole('alert').filter({ hasText: 'Changes are not being saved' });

/** Reads the raw `blocks` store, bypassing the app, so the test sees only what really reached IndexedDB. */
function readBlocks(page: Page): Promise<Block[]> {
  return page.evaluate(
    () =>
      new Promise<Block[]>((resolve, reject) => {
        const request = indexedDB.open('ofelia');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const all = db.transaction('blocks').objectStore('blocks').getAll();
          all.onsuccess = () => {
            db.close();
            resolve(all.result as Block[]);
          };
          all.onerror = () => {
            db.close();
            reject(all.error);
          };
        };
      }),
  );
}

async function topLevelContents(page: Page): Promise<string[]> {
  return (await readBlocks(page))
    .filter((b) => b.parentId === null)
    .sort((a, b) => (a.order < b.order ? -1 : 1))
    .map((b) => b.content);
}

/** Stored blocks plus what the editor shows, used to compare the journal before and after a restart. */
async function snapshot(page: Page, blockCount: number) {
  await expect(editors(page)).toHaveCount(blockCount);
  const blocks = (await readBlocks(page)).sort((a, b) => a.id.localeCompare(b.id));
  const shown = await editors(page).evaluateAll((els) => els.map((el) => (el as HTMLTextAreaElement).value));
  return { blocks, shown };
}

test('Any change (create, edit, move, delete, state change) is saved to IndexedDB within 1 second, with no save action needed', async ({
  page,
}) => {
  await page.goto('/');
  await expect(editors(page).first()).toBeFocused();

  // Edit (and implicit create of the placeholder block).
  await page.keyboard.type('First');
  await expect.poll(() => topLevelContents(page), POLL).toEqual(['First']);

  // Create.
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second');
  await expect.poll(() => topLevelContents(page), POLL).toEqual(['First', 'Second']);

  // State change.
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect
    .poll(async () => (await readBlocks(page)).find((b) => b.content === 'Second')?.task?.state, POLL)
    .toBe('TODO');

  // Move.
  await page.keyboard.press('Enter');
  await page.keyboard.type('Third');
  await expect.poll(() => topLevelContents(page), POLL).toEqual(['First', 'Second', 'Third']);
  await page.keyboard.press('Alt+Shift+ArrowUp');
  await expect.poll(() => topLevelContents(page), POLL).toEqual(['First', 'Third', 'Second']);

  // Delete: empty the block, then Backspace removes it.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect.poll(() => topLevelContents(page), POLL).toEqual(['First', 'Second']);

  await expect(page.getByRole('button', { name: /save/i })).toHaveCount(0);
  await expect(storageBanner(page)).toHaveCount(0);
});

test('After a page reload or a browser restart, the journal shows exactly the content it had before', async ({
  playwright,
  browserName,
  baseURL,
}, testInfo) => {
  const profile = testInfo.outputPath('profile');
  const launch = async () => {
    const context = await playwright[browserName].launchPersistentContext(profile, { baseURL });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto('/');
    return { context, page };
  };

  let { context, page } = await launch();
  try {
    await expect(editors(page).first()).toBeFocused();
    await page.keyboard.type('Morning notes #work');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Call the bank');
    await expect
      .poll(async () => (await readBlocks(page)).map((b) => b.content).sort())
      .toEqual(['Call the bank', 'Morning notes #work']);
    const before = await snapshot(page, 2);

    await page.reload();
    expect(await snapshot(page, 2)).toEqual(before);

    await context.close();
    ({ context, page } = await launch());
    expect(await snapshot(page, 2)).toEqual(before);
  } finally {
    await context.close();
  }
});

test('If browser storage is unavailable or full, a visible error banner explains that changes are not being saved', async ({
  page,
  context,
}) => {
  await test.step('storage full', async () => {
    await page.goto('/');
    await expect(editors(page).first()).toBeFocused();
    await expect(storageBanner(page)).toHaveCount(0);

    await page.evaluate(() => {
      const quotaExceeded = () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
      IDBObjectStore.prototype.put = quotaExceeded;
      IDBObjectStore.prototype.add = quotaExceeded;
    });
    await page.keyboard.type('This cannot be stored');

    await expect(storageBanner(page)).toBeVisible();
  });

  await test.step('storage unavailable', async () => {
    const offline = await context.newPage();
    await offline.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', { value: undefined });
    });

    await offline.goto('/');

    await expect(storageBanner(offline)).toBeVisible();
  });
});
