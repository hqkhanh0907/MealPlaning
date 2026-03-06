import { BasePage } from './BasePage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

export class GroceryPage extends BasePage {
  async selectScope(scope: 'day' | 'week' | 'custom') {
    await this.waitAndClick(`tab-grocery-${scope}`);
  }

  async tapCopy() {
    await this.waitAndClick('btn-grocery-copy');
  }

  /** Tap a grocery item's check button by ingredient ID. */
  async tapGroceryItem(id: string) {
    await this.waitAndClick(`grocery-item-${id}`);
  }

  /** Return the ID of the first ingredient that appears in the grocery list
   *  (i.e. the first ingredient in localStorage mp-ingredients).
   */
  async getFirstGroceryItemId(): Promise<string | null> {
    return (browser as unknown as ExecutableBrowser).execute(() => {
      const items = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      return items[0]?.id ?? null;
    });
  }
}
